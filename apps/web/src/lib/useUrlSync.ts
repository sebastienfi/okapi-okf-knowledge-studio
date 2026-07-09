import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';

const NODE_HASH = /^#\/node\/(.+)$/;

/** Two-way sync between the selected node and the URL hash (#/node/<id>). */
export function useUrlSync() {
  const selectedId = useAppStore((s) => s.selectedId);

  useEffect(() => {
    const apply = () => {
      const match = NODE_HASH.exec(window.location.hash);
      const id = match?.[1] ? decodeURIComponent(match[1]) : null;
      if (id !== useAppStore.getState().selectedId) useAppStore.getState().select(id);
    };
    apply();
    window.addEventListener('hashchange', apply);
    return () => window.removeEventListener('hashchange', apply);
  }, []);

  useEffect(() => {
    const want = selectedId ? `#/node/${encodeURIComponent(selectedId)}` : '';
    const current = window.location.hash;
    if (current !== want) {
      const url = want || window.location.pathname + window.location.search;
      window.history.replaceState(null, '', url);
    }
  }, [selectedId]);
}
