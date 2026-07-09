import { Command } from 'cmdk';
import Fuse from 'fuse.js';
import { Hash, Maximize2, MonitorCog, Moon, Sun } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { GraphResponse } from '../../api/types';
import { buildTypeColorMap } from '../../lib/colorForType';
import { useAppStore } from '../../store/useAppStore';

export function CommandPalette({ graph }: { graph: GraphResponse }) {
  const open = useAppStore((s) => s.paletteOpen);
  const setOpen = useAppStore((s) => s.setPaletteOpen);
  const select = useAppStore((s) => s.select);
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const toggleSystem = useAppStore((s) => s.toggleSystem);
  const requestFit = useAppStore((s) => s.requestFit);
  const [search, setSearch] = useState('');

  const colorMap = useMemo(
    () =>
      buildTypeColorMap(
        graph.meta.types.map((t) => t.type),
        theme,
      ),
    [graph.meta.types, theme],
  );
  const fuse = useMemo(
    () =>
      new Fuse(graph.nodes, {
        keys: ['title', 'type', 'conceptId'],
        threshold: 0.4,
        ignoreLocation: true,
      }),
    [graph.nodes],
  );

  const results = useMemo(() => {
    if (search.trim())
      return fuse
        .search(search)
        .slice(0, 40)
        .map((r) => r.item);
    return [...graph.nodes]
      .filter((n) => !n.isSystem)
      .sort((a, b) => b.degree - a.degree)
      .slice(0, 24);
  }, [search, fuse, graph.nodes]);

  const run = (fn: () => void) => {
    fn();
    setOpen(false);
    setSearch('');
  };

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Command palette"
      shouldFilter={false}
      className="fixed inset-0 z-50"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={() => setOpen(false)}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />
      <div className="absolute left-1/2 top-[15vh] w-[min(92vw,640px)] -translate-x-1/2 overflow-hidden rounded-xl border border-border-strong bg-surface shadow-2xl">
        <Command.Input
          value={search}
          onValueChange={setSearch}
          placeholder="Search concepts, or run an action…"
          className="w-full border-b border-border bg-transparent px-4 py-3.5 text-sm text-fg outline-none placeholder:text-faint"
        />
        <Command.List className="max-h-[52vh] overflow-y-auto p-2">
          <Command.Empty className="px-3 py-6 text-center text-sm text-faint">
            No matches.
          </Command.Empty>

          <Command.Group
            heading="Jump to concept"
            className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-faint"
          >
            {results.map((n) => (
              <Command.Item
                key={n.id}
                value={`${n.id} ${n.title} ${n.type ?? ''}`}
                onSelect={() => run(() => select(n.id))}
                className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-fg data-[selected=true]:bg-brand/15 data-[selected=true]:text-fg"
              >
                {n.isSystem ? (
                  <Hash size={14} className="text-faint" />
                ) : (
                  <span
                    className="size-2.5 shrink-0 rounded-[3px]"
                    style={{ backgroundColor: colorMap.get(n.type ?? '') ?? 'var(--k-faint)' }}
                  />
                )}
                <span className="truncate">{n.title}</span>
                <span className="ml-auto truncate font-mono text-xs text-faint">
                  {n.type ?? n.name}
                </span>
              </Command.Item>
            ))}
          </Command.Group>

          <Command.Group
            heading="Actions"
            className="mt-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-faint"
          >
            <PaletteAction
              icon={<Maximize2 size={14} />}
              label="Fit graph to view"
              onSelect={() => run(requestFit)}
            />
            <PaletteAction
              icon={theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
              label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
              onSelect={() => run(toggleTheme)}
            />
            <PaletteAction
              icon={<MonitorCog size={14} />}
              label="Toggle system nodes"
              onSelect={() => run(toggleSystem)}
            />
          </Command.Group>
        </Command.List>
      </div>
    </Command.Dialog>
  );
}

function PaletteAction({
  icon,
  label,
  onSelect,
}: {
  icon: React.ReactNode;
  label: string;
  onSelect: () => void;
}) {
  return (
    <Command.Item
      value={label}
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-fg data-[selected=true]:bg-brand/15"
    >
      <span className="text-muted">{icon}</span>
      {label}
    </Command.Item>
  );
}
