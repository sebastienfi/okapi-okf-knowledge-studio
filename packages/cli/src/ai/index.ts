import { resolveTarget } from '@okapi/core';
import type { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import type { Bundle } from '../bundle';
import { type AiConfig, type ChatMessage, streamChat } from './providers';
import { buildContext } from './retrieval';

const MAX_HISTORY = 12;

function sanitizeHistory(raw: unknown): ChatMessage[] {
  if (!Array.isArray(raw)) return [];
  const out: ChatMessage[] = [];
  for (const m of raw) {
    if (
      m &&
      typeof m === 'object' &&
      (m.role === 'user' || m.role === 'assistant') &&
      typeof m.content === 'string' &&
      m.content.trim()
    ) {
      out.push({ role: m.role, content: m.content });
    }
  }
  return out.slice(-MAX_HISTORY);
}

export type { AiConfig } from './providers';
export { resolveAiConfig } from './providers';

const SYSTEM_PROMPT = `You are Okapi, a knowledgeable guide to an OKF (Open Knowledge Format) bundle.
Answer the user's question using ONLY the concepts provided as context. Be concise and specific.

Rules:
- Ground every claim in the provided concepts. If the answer is not in them, say so plainly.
- When you reference a concept, cite it as a markdown link using its bundle path, e.g. [Repository](/model/repository.md).
- Prefer linking concepts over quoting them at length.
- Use short paragraphs and lists. Do not invent paths or facts.`;

/** Extract cited bundle node ids from the answer's markdown links. */
function extractCitations(answer: string, sources: string[], bundle: Bundle): string[] {
  const found = new Set<string>();
  const linkRe = /\]\(\s*([^)\s]+)/g;
  let m: RegExpExecArray | null;
  // biome-ignore lint/suspicious/noAssignInExpressions: standard regex exec loop
  while ((m = linkRe.exec(answer)) !== null) {
    const target = resolveTarget(m[1] ?? '', 'index.md');
    if (target && bundle.getNode(target)) found.add(target);
  }
  if (found.size === 0) {
    for (const s of sources.slice(0, 3)) found.add(s);
  }
  return [...found];
}

/** Register the AI routes on the Hono app. Passed to createApp via `registerAi`. */
export function makeAiRegistrar(bundle: Bundle, config: AiConfig) {
  return (app: Hono) => {
    app.get('/api/ai/status', (c) =>
      c.json({
        enabled: config.enabled,
        consent: config.enabled,
        provider: config.enabled ? config.provider : undefined,
        model: config.enabled ? config.model : undefined,
        available: config.available,
        reason: config.enabled
          ? undefined
          : config.available.length === 0
            ? 'Set OPENAI_API_KEY or ANTHROPIC_API_KEY, then start Okapi with --ai'
            : 'Start Okapi with --ai to enable AI features',
      }),
    );

    app.post('/api/ai/ask', async (c) => {
      if (!config.enabled) {
        return c.json({ error: 'AI is disabled', code: 'disabled' }, 501);
      }
      let body: { question?: unknown; history?: unknown };
      try {
        body = await c.req.json();
      } catch {
        return c.json({ error: 'invalid JSON body' }, 400);
      }
      const question = typeof body.question === 'string' ? body.question.trim() : '';
      if (!question) return c.json({ error: 'question (string) is required' }, 400);
      const history = sanitizeHistory(body.history);

      const { context, sources } = buildContext(bundle, question);

      return streamSSE(c, async (sse) => {
        const controller = new AbortController();
        sse.onAbort(() => controller.abort());
        let full = '';
        try {
          const deltas = streamChat(config, {
            system: `${SYSTEM_PROMPT}\n\n${context}`,
            messages: [...history, { role: 'user', content: question }],
            signal: controller.signal,
          });
          for await (const delta of deltas) {
            full += delta;
            await sse.writeSSE({ event: 'token', data: JSON.stringify({ text: delta }) });
          }
          await sse.writeSSE({
            event: 'citations',
            data: JSON.stringify({ paths: extractCitations(full, sources, bundle) }),
          });
          await sse.writeSSE({ event: 'done', data: '{}' });
        } catch (err) {
          if (!controller.signal.aborted) {
            await sse.writeSSE({
              event: 'error',
              data: JSON.stringify({ message: (err as Error).message || 'AI request failed' }),
            });
          }
        }
      });
    });
  };
}
