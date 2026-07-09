import fs from 'node:fs/promises';
import { sha256, stripBom } from '@okapi/core';
import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import type { Bundle } from './bundle';
import { PathError, assertParentInsideBundle, atomicWrite, resolveInBundle } from './save';
import type { BundleEvent, EventHub } from './sse';
import { mimeFor, serveWebApp } from './static';

const MAX_SAVE_BYTES = 10 * 1024 * 1024;

/** Optional hook so the AI layer (milestone 7) can register its routes. */
export type RegisterRoutes = (app: Hono) => void;

export interface ServerDeps {
  bundle: Bundle;
  hub: EventHub;
  publicDir: string;
  version: string;
  markSelfWrite?: (rel: string) => void;
  registerAi?: RegisterRoutes;
}

export function createApp(deps: ServerDeps): Hono {
  const app = new Hono();
  const { bundle, hub } = deps;

  app.get('/api/health', (c) =>
    c.json({ ok: true, version: deps.version, bundle: bundle.graph.meta.bundleName }),
  );

  app.get('/api/graph', (c) => {
    const includeSystem = c.req.query('includeSystem') !== 'false';
    const graph = bundle.graph;
    if (includeSystem) return c.json(graph);
    const nodes = graph.nodes.filter((n) => !n.isSystem);
    const ids = new Set(nodes.map((n) => n.id));
    const edges = graph.edges.filter((e) => ids.has(e.source) && ids.has(e.target));
    return c.json({ ...graph, nodes, edges });
  });

  app.get('/api/node', async (c) => {
    const p = c.req.query('path');
    if (!p) return c.json({ error: 'missing ?path query parameter' }, 400);
    const detail = await bundle.nodeDetail(p);
    if (!detail) return c.json({ error: 'node not found', path: p }, 404);
    return c.json(detail);
  });

  app.put('/api/node', async (c) => {
    const p = c.req.query('path');
    if (!p) return c.json({ error: 'missing ?path query parameter' }, 400);
    if (!p.endsWith('.md')) return c.json({ error: 'only .md files can be edited' }, 400);
    if (!bundle.getNode(p)) return c.json({ error: 'node not found', path: p }, 404);

    let body: { content?: unknown; baseHash?: unknown };
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'invalid JSON body' }, 400);
    }
    if (typeof body.content !== 'string') {
      return c.json({ error: 'body.content (string) is required' }, 400);
    }
    if (Buffer.byteLength(body.content, 'utf8') > MAX_SAVE_BYTES) {
      return c.json({ error: 'file too large' }, 413);
    }

    let abs: string;
    try {
      abs = resolveInBundle(bundle.root, p);
      await assertParentInsideBundle(bundle.root, abs);
    } catch (err) {
      if (err instanceof PathError) return c.json({ error: err.message }, 400);
      throw err;
    }

    const current = stripBom(await fs.readFile(abs, 'utf8'));
    const currentHash = sha256(current);
    if (typeof body.baseHash === 'string' && body.baseHash !== currentHash) {
      return c.json(
        { error: 'file changed on disk since it was opened', code: 'conflict', current },
        409,
      );
    }

    deps.markSelfWrite?.(p);
    await atomicWrite(abs, body.content);
    await bundle.rebuild();
    hub.publish({
      type: 'bundle-changed',
      change: 'updated',
      path: p,
      originId: c.req.header('x-okapi-client') ?? undefined,
    });

    const detail = await bundle.nodeDetail(p);
    return c.json(detail);
  });

  app.get('/api/files/*', async (c) => {
    const prefix = '/api/files/';
    const rel = new URL(c.req.url).pathname.slice(prefix.length);
    try {
      const abs = resolveInBundle(bundle.root, rel);
      const data = await fs.readFile(abs);
      return new Response(data, { headers: { 'content-type': mimeFor(abs) } });
    } catch {
      return c.notFound();
    }
  });

  app.get('/api/lint', (c) => {
    const strict = c.req.query('strict') === 'true';
    const graph = bundle.graph;
    const files = graph.nodes.map((n) => ({
      id: n.id,
      isSystem: n.isSystem,
      ok: n.conformance.ok,
      errors: n.conformance.errors,
      missing: n.conformance.missing,
      brokenLinks: n.brokenLinks,
    }));
    const errorCount = graph.nodes.reduce(
      (sum, n) => sum + n.conformance.errors.length + (strict ? n.conformance.missing.length : 0),
      0,
    );
    return c.json({
      conformant: errorCount === 0,
      strict,
      errorCount,
      brokenLinks: graph.meta.counts.brokenLinks,
      files,
    });
  });

  app.get('/api/report', (c) => {
    const graph = bundle.graph;
    const orphans = graph.nodes.filter((n) => !n.isSystem && n.degree === 0).map((n) => n.id);
    const brokenLinks = graph.nodes.flatMap((n) =>
      n.brokenLinks.map((b) => ({ from: n.id, to: b.resolved, raw: b.raw })),
    );
    const nonConformant = graph.nodes
      .filter((n) => !n.conformance.ok)
      .map((n) => ({ id: n.id, errors: n.conformance.errors }));
    const staleTimestamp = graph.nodes.filter((n) => !n.isSystem && !n.timestamp).map((n) => n.id);
    return c.json({
      counts: graph.meta.counts,
      types: graph.meta.types,
      orphans,
      brokenLinks,
      nonConformant,
      staleTimestamp,
    });
  });

  app.get('/api/events', (c) =>
    streamSSE(c, async (sse) => {
      const queue: BundleEvent[] = [];
      let wake: (() => void) | null = null;
      const unsub = hub.subscribe((event) => {
        queue.push(event);
        wake?.();
      });
      sse.onAbort(() => {
        unsub();
        wake?.();
      });

      await sse.writeSSE({ event: 'ready', data: '{}' });
      try {
        while (!sse.aborted) {
          while (queue.length > 0) {
            const event = queue.shift();
            if (event) await sse.writeSSE({ event: event.type, data: JSON.stringify(event) });
          }
          if (sse.aborted) break;
          await new Promise<void>((resolve) => {
            wake = resolve;
            const timer = setTimeout(resolve, 15000);
            sse.onAbort(() => {
              clearTimeout(timer);
              resolve();
            });
          });
          wake = null;
          if (!sse.aborted && queue.length === 0) {
            await sse.writeSSE({ event: 'ping', data: '{}' });
          }
        }
      } finally {
        unsub();
      }
    }),
  );

  // AI routes are registered by the AI layer when enabled; otherwise report disabled.
  if (deps.registerAi) {
    deps.registerAi(app);
  } else {
    app.get('/api/ai/status', (c) =>
      c.json({ enabled: false, consent: false, reason: 'AI is off' }),
    );
    app.post('/api/ai/ask', (c) => c.json({ error: 'AI is disabled' }, 501));
  }

  // Static web app + SPA fallback (must be last).
  app.get('*', (c) => serveWebApp(c, deps.publicDir));

  return app;
}
