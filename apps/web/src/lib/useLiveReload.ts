import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { CLIENT_ID } from '../api/client';

/**
 * Subscribe to the server's SSE stream and refresh queries when the bundle
 * changes on disk (external edits or another tab). Ignores the echo of our own
 * saves via the originId sent on writes.
 */
export function useLiveReload() {
  const qc = useQueryClient();
  useEffect(() => {
    const source = new EventSource('/api/events');
    const onChange = (e: MessageEvent) => {
      let originId: string | undefined;
      try {
        originId = JSON.parse(e.data).originId;
      } catch {
        // ignore malformed payloads
      }
      if (originId === CLIENT_ID) return;
      qc.invalidateQueries({ queryKey: ['graph'] });
      qc.invalidateQueries({ queryKey: ['node'] });
    };
    source.addEventListener('bundle-changed', onChange as EventListener);
    return () => {
      source.removeEventListener('bundle-changed', onChange as EventListener);
      source.close();
    };
  }, [qc]);
}
