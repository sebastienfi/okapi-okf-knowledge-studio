import { X } from 'lucide-react';
import { AskPanel } from '../features/ai/AskPanel';
import { DetailPanel } from '../features/detail/DetailPanel';
import { InsightsPanel } from '../features/insights/InsightsPanel';
import { cn } from '../lib/cn';
import { type DockTab, useAppStore } from '../store/useAppStore';

const TABS: { id: DockTab; label: string }[] = [
  { id: 'detail', label: 'Detail' },
  { id: 'insights', label: 'Insights' },
  { id: 'ask', label: 'Ask' },
];

export function RightDock() {
  const dockTab = useAppStore((s) => s.dockTab);
  const setDockTab = useAppStore((s) => s.setDockTab);
  const selectedId = useAppStore((s) => s.selectedId);
  const closeDock = useAppStore((s) => s.closeDock);

  return (
    <div className="flex h-full w-[440px] flex-col bg-surface">
      <div className="flex items-center gap-1 border-b border-border px-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setDockTab(t.id)}
            className={cn(
              'relative px-3 py-2.5 text-sm font-medium transition-colors',
              dockTab === t.id ? 'text-fg' : 'text-faint hover:text-muted',
            )}
          >
            {t.label}
            {dockTab === t.id && (
              <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand" />
            )}
          </button>
        ))}
        <button
          type="button"
          onClick={closeDock}
          aria-label="Close panel"
          className="ml-auto mr-1 grid size-8 place-items-center rounded-md text-muted hover:bg-surface-2 hover:text-fg"
        >
          <X size={17} />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        {dockTab === 'detail' &&
          (selectedId ? (
            <DetailPanel nodeId={selectedId} />
          ) : (
            <div className="grid flex-1 place-items-center px-8 text-center text-sm text-muted">
              Select a concept in the graph to see its details.
            </div>
          ))}
        {dockTab === 'insights' && <InsightsPanel />}
        {dockTab === 'ask' && <AskPanel />}
      </div>
    </div>
  );
}
