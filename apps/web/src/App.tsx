import { useEffect } from 'react';
import { useGraph } from './api/client';
import { AppShell } from './components/AppShell';
import { EmptyState, ErrorState, LoadingState } from './features/states/States';
import { useLiveReload } from './lib/useLiveReload';
import { useUrlSync } from './lib/useUrlSync';
import { useAppStore } from './store/useAppStore';

function isTypingTarget(el: EventTarget | null): boolean {
  const node = el as HTMLElement | null;
  if (!node) return false;
  const tag = node.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || node.isContentEditable;
}

export default function App() {
  const theme = useAppStore((s) => s.theme);
  const setPaletteOpen = useAppStore((s) => s.setPaletteOpen);
  useUrlSync();
  useLiveReload();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen(true);
      } else if (e.key === '/' && !isTypingTarget(e.target)) {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setPaletteOpen]);

  const { data: graph, isLoading, error, refetch } = useGraph();

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={(error as Error).message} onRetry={() => refetch()} />;
  if (!graph || graph.nodes.length === 0) return <EmptyState />;

  return <AppShell graph={graph} />;
}
