import { CLIENT_ID } from '../api/client';

export interface AskTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface AskHandlers {
  history?: AskTurn[];
  onToken: (text: string) => void;
  onCitations: (paths: string[]) => void;
  signal?: AbortSignal;
}

/**
 * POST a question to /api/ai/ask and consume the SSE response. EventSource only
 * supports GET, so we read the streamed body and parse SSE frames by hand.
 */
export async function askBundle(question: string, handlers: AskHandlers): Promise<void> {
  const res = await fetch('/api/ai/ask', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-okapi-client': CLIENT_ID },
    body: JSON.stringify({ question, history: handlers.history ?? [] }),
    signal: handlers.signal,
  });
  if (!res.ok || !res.body) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Request failed (${res.status})`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    for (;;) {
      const sep = buffer.indexOf('\n\n');
      if (sep === -1) break;
      const frame = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      let event = 'message';
      let data = '';
      for (const line of frame.split('\n')) {
        if (line.startsWith('event:')) event = line.slice(6).trim();
        else if (line.startsWith('data:')) data += line.slice(5).trim();
      }
      if (!data) continue;
      if (event === 'token') handlers.onToken(JSON.parse(data).text);
      else if (event === 'citations') handlers.onCitations(JSON.parse(data).paths);
      else if (event === 'error') throw new Error(JSON.parse(data).message);
    }
  }
}
