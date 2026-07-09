import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { GraphResponse, NodeDetail } from './types';

/** Stable per-tab id, sent on writes so we can ignore our own watch echo. */
export const CLIENT_ID =
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `c${Date.now()}`;

export interface AiStatus {
  enabled: boolean;
  consent: boolean;
  reason?: string;
  provider?: 'openai' | 'anthropic';
  model?: string;
  available?: string[];
}

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new HttpError(res.status, body.error ?? res.statusText, body);
  }
  return res.json() as Promise<T>;
}

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public body: unknown,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export function useGraph() {
  return useQuery({
    queryKey: ['graph'],
    queryFn: () => fetch('/api/graph').then((r) => json<GraphResponse>(r)),
    staleTime: 5_000,
  });
}

export function useNode(path: string | null) {
  return useQuery({
    queryKey: ['node', path],
    enabled: !!path,
    queryFn: () =>
      fetch(`/api/node?path=${encodeURIComponent(path as string)}`).then((r) =>
        json<NodeDetail>(r),
      ),
  });
}

export function useAiStatus() {
  return useQuery({
    queryKey: ['ai-status'],
    queryFn: () => fetch('/api/ai/status').then((r) => json<AiStatus>(r)),
    staleTime: 30_000,
  });
}

export interface SaveArgs {
  path: string;
  content: string;
  baseHash: string;
}

export function useSaveNode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ path, content, baseHash }: SaveArgs) => {
      const res = await fetch(`/api/node?path=${encodeURIComponent(path)}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json', 'x-okapi-client': CLIENT_ID },
        body: JSON.stringify({ content, baseHash }),
      });
      return json<NodeDetail>(res);
    },
    onSuccess: (detail) => {
      qc.setQueryData(['node', detail.node.id], detail);
      qc.invalidateQueries({ queryKey: ['graph'] });
    },
  });
}
