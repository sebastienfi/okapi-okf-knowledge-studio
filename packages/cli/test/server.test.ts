import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Bundle } from '../src/bundle';
import { createApp } from '../src/server';
import { EventHub } from '../src/sse';

const here = path.dirname(fileURLToPath(import.meta.url));
const fixtures = path.join(here, '../../../fixtures');

// biome-ignore lint/suspicious/noExplicitAny: test convenience for JSON bodies
const readJson = (res: Response): Promise<any> => res.json() as Promise<any>;

let tmpDir: string;
let app: ReturnType<typeof createApp>;
let bundle: Bundle;

beforeAll(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'okapi-test-'));
  await fs.cp(path.join(fixtures, 'strata'), tmpDir, { recursive: true });
  bundle = await Bundle.open(tmpDir);
  app = createApp({ bundle, hub: new EventHub(), publicDir: '/nonexistent', version: 'test' });
});

afterAll(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe('GET /api/graph', () => {
  it('returns the full graph with correct counts', async () => {
    const res = await app.request('/api/graph');
    expect(res.status).toBe(200);
    const body = await readJson(res);
    expect(body.meta.counts.nodes).toBe(38);
    expect(body.meta.counts.concepts).toBe(31);
    expect(body.meta.okfVersion).toBe('0.1');
  });

  it('drops system nodes when includeSystem=false', async () => {
    const res = await app.request('/api/graph?includeSystem=false');
    const body = await readJson(res);
    expect(body.nodes.every((n: { isSystem: boolean }) => !n.isSystem)).toBe(true);
    expect(body.nodes.length).toBe(31);
  });
});

describe('GET /api/node', () => {
  it('returns full detail for a node', async () => {
    const res = await app.request('/api/node?path=model/repository.md');
    expect(res.status).toBe(200);
    const body = await readJson(res);
    expect(body.node.type).toBe('Graph Node');
    expect(body.raw).toContain('type: Graph Node');
    expect(body.hash).toMatch(/^[a-f0-9]{64}$/);
    expect(body.neighbors.length).toBeGreaterThan(0);
  });

  it('404s for an unknown node', async () => {
    const res = await app.request('/api/node?path=nope/ghost.md');
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/node', () => {
  it('saves a byte-exact round-trip and rebuilds the graph', async () => {
    const before = await readJson(await app.request('/api/node?path=overview.md'));
    const edited = `${before.raw}\n\nAppended by test.\n`;
    const res = await app.request('/api/node?path=overview.md', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ content: edited, baseHash: before.hash }),
    });
    expect(res.status).toBe(200);
    const onDisk = await fs.readFile(path.join(tmpDir, 'overview.md'), 'utf8');
    expect(onDisk).toBe(edited);
  });

  it('409s on a stale baseHash', async () => {
    const res = await app.request('/api/node?path=overview.md', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ content: 'x', baseHash: 'deadbeef' }),
    });
    expect(res.status).toBe(409);
  });

  it('rejects path traversal', async () => {
    const res = await app.request('/api/node?path=../../etc/passwd', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ content: 'x' }),
    });
    // Not a known node -> 404 before we even touch the filesystem.
    expect([400, 404]).toContain(res.status);
    const passwd = path.join(tmpDir, '..', '..', 'etc', 'passwd-okapi-test');
    await expect(fs.access(passwd)).rejects.toBeTruthy();
  });

  it('rejects non-.md targets', async () => {
    const res = await app.request('/api/node?path=overview.txt', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ content: 'x' }),
    });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/lint & /api/report', () => {
  it('lints the bundle', async () => {
    const res = await app.request('/api/lint');
    const body = await readJson(res);
    expect(typeof body.conformant).toBe('boolean');
    expect(body.files.length).toBe(38);
  });

  it('reports health', async () => {
    const res = await app.request('/api/report');
    const body = await readJson(res);
    expect(body.counts.nodes).toBe(38);
    expect(Array.isArray(body.orphans)).toBe(true);
  });
});

describe('GET /api/ai/status (disabled by default)', () => {
  it('reports AI off', async () => {
    const res = await app.request('/api/ai/status');
    const body = await readJson(res);
    expect(body.enabled).toBe(false);
  });
});
