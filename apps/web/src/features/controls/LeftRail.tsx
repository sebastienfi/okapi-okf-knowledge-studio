import { Maximize2 } from 'lucide-react';
import { useMemo } from 'react';
import type { BundleMeta } from '../../api/types';
import { cn } from '../../lib/cn';
import { buildTypeColorMap } from '../../lib/colorForType';
import { useAppStore } from '../../store/useAppStore';

export function LeftRail({ meta }: { meta: BundleMeta }) {
  const theme = useAppStore((s) => s.theme);
  const disabledTypes = useAppStore((s) => s.disabledTypes);
  const toggleType = useAppStore((s) => s.toggleType);
  const setOnlyType = useAppStore((s) => s.setOnlyType);
  const showAllTypes = useAppStore((s) => s.showAllTypes);
  const showSystem = useAppStore((s) => s.showSystem);
  const toggleSystem = useAppStore((s) => s.toggleSystem);
  const requestFit = useAppStore((s) => s.requestFit);

  const colorMap = useMemo(
    () =>
      buildTypeColorMap(
        meta.types.map((t) => t.type),
        theme,
      ),
    [meta.types, theme],
  );
  const allTypes = meta.types.map((t) => t.type);
  const someDisabled = disabledTypes.size > 0;

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-surface/50">
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-faint">Types</h2>
        {someDisabled && (
          <button
            type="button"
            onClick={showAllTypes}
            className="text-xs text-brand hover:underline"
          >
            Show all
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2">
        <ul className="space-y-0.5">
          {meta.types.map(({ type, count }) => {
            const disabled = disabledTypes.has(type);
            return (
              <li key={type}>
                <div
                  className={cn(
                    'group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-surface-2',
                    disabled && 'opacity-45',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => toggleType(type)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    aria-pressed={!disabled}
                  >
                    <span
                      className="size-2.5 shrink-0 rounded-[3px]"
                      style={{ backgroundColor: colorMap.get(type) }}
                    />
                    <span
                      className={cn('truncate text-fg', disabled && 'line-through')}
                      title={type}
                    >
                      {type}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOnlyType(type, allTypes)}
                    className="hidden text-[11px] text-faint hover:text-brand group-hover:block"
                    title="Show only this type"
                  >
                    only
                  </button>
                  <span className="font-mono text-xs tabular-nums text-faint">{count}</span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex items-center justify-between border-t border-border px-3 py-3 text-sm">
        <span className="text-muted">
          System nodes <span className="font-mono text-xs text-faint">({meta.counts.system})</span>
        </span>
        <Toggle checked={showSystem} onChange={toggleSystem} label="Show system nodes" />
      </div>

      <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-faint">
        <span className="font-mono tabular-nums">
          {meta.counts.concepts} nodes · {meta.counts.edges} links
        </span>
        <button
          type="button"
          onClick={requestFit}
          title="Fit graph to view"
          className="grid size-7 place-items-center rounded-md border border-border text-muted hover:bg-surface-2 hover:text-fg"
        >
          <Maximize2 size={14} />
        </button>
      </div>
    </aside>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={cn(
        'relative h-5 w-9 rounded-full border transition-colors',
        checked ? 'border-brand bg-brand' : 'border-border bg-surface-2',
      )}
    >
      <span
        className={cn(
          'absolute top-1/2 size-3.5 -translate-y-1/2 rounded-full bg-white shadow transition-all',
          checked ? 'left-[18px]' : 'left-[3px]',
        )}
      />
    </button>
  );
}
