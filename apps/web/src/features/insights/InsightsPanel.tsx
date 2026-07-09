import { AlertTriangle, CircleOff, Clock, Link2Off, Network } from 'lucide-react';
import { useMemo } from 'react';
import { useGraph } from '../../api/client';
import type { GraphResponse } from '../../api/types';
import { buildTypeColorMap } from '../../lib/colorForType';
import { useAppStore } from '../../store/useAppStore';

interface Insights {
  orphans: string[];
  broken: { from: string; to: string }[];
  components: number;
  nonConformant: { id: string; errors: string[] }[];
  staleTimestamp: string[];
}

function computeInsights(graph: GraphResponse): Insights {
  const concepts = graph.nodes.filter((n) => !n.isSystem);
  const orphans = concepts.filter((n) => n.degree === 0).map((n) => n.id);

  const broken = graph.nodes.flatMap((n) =>
    n.brokenLinks.map((b) => ({ from: n.id, to: b.resolved })),
  );

  // weakly-connected components over concept nodes (union-find)
  const parent = new Map<string, string>();
  const find = (x: string): string => {
    let r = x;
    while (parent.get(r) !== r) r = parent.get(r) as string;
    let c = x;
    while (parent.get(c) !== r) {
      const next = parent.get(c) as string;
      parent.set(c, r);
      c = next;
    }
    return r;
  };
  const union = (a: string, b: string) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  };
  for (const n of concepts) parent.set(n.id, n.id);
  const isConcept = new Set(concepts.map((n) => n.id));
  for (const e of graph.edges) {
    if (isConcept.has(e.source) && isConcept.has(e.target)) union(e.source, e.target);
  }
  const roots = new Set(concepts.map((n) => find(n.id)));

  const nonConformant = graph.nodes
    .filter((n) => !n.conformance.ok)
    .map((n) => ({ id: n.id, errors: n.conformance.errors }));
  const staleTimestamp = concepts.filter((n) => !n.timestamp).map((n) => n.id);

  return { orphans, broken, components: roots.size, nonConformant, staleTimestamp };
}

export function InsightsPanel() {
  const { data: graph } = useGraph();
  const theme = useAppStore((s) => s.theme);
  const select = useAppStore((s) => s.select);
  const insights = useMemo(() => (graph ? computeInsights(graph) : null), [graph]);
  const colorMap = useMemo(
    () =>
      buildTypeColorMap(
        (graph?.meta.types ?? []).map((t) => t.type),
        theme,
      ),
    [graph?.meta.types, theme],
  );

  if (!graph || !insights) return <div className="p-5 text-sm text-muted">Loading…</div>;

  const total = graph.meta.counts.concepts || 1;

  return (
    <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
      <div className="grid grid-cols-2 gap-2">
        <Stat label="Concepts" value={graph.meta.counts.concepts} />
        <Stat label="Links" value={graph.meta.counts.edges} />
        <Stat label="Types" value={graph.meta.types.length} />
        <Stat
          label="Groups"
          value={insights.components}
          hint={insights.components > 1 ? 'disconnected' : 'connected'}
        />
      </div>

      <Section icon={<Network size={14} />} title="Type distribution">
        <div className="space-y-1.5">
          {graph.meta.types.map((t) => (
            <button
              key={t.type}
              type="button"
              onClick={() =>
                useAppStore.getState().setOnlyType(
                  t.type,
                  graph.meta.types.map((x) => x.type),
                )
              }
              className="group flex w-full items-center gap-2 text-left"
            >
              <span className="w-28 shrink-0 truncate text-xs text-muted" title={t.type}>
                {t.type}
              </span>
              <span className="relative h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                <span
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    width: `${(t.count / total) * 100}%`,
                    backgroundColor: colorMap.get(t.type),
                  }}
                />
              </span>
              <span className="w-6 shrink-0 text-right font-mono text-xs text-faint">
                {t.count}
              </span>
            </button>
          ))}
        </div>
      </Section>

      <IssueSection
        icon={<Link2Off size={14} />}
        title="Broken links"
        count={insights.broken.length}
        tone="warning"
        items={insights.broken.map((b) => ({ id: b.from, label: `${b.from} → ${b.to}` }))}
        onSelect={select}
      />
      <IssueSection
        icon={<CircleOff size={14} />}
        title="Orphan concepts"
        count={insights.orphans.length}
        tone="muted"
        items={insights.orphans.map((id) => ({ id, label: id }))}
        onSelect={select}
      />
      <IssueSection
        icon={<AlertTriangle size={14} />}
        title="Non-conformant"
        count={insights.nonConformant.length}
        tone="danger"
        items={insights.nonConformant.map((n) => ({
          id: n.id,
          label: `${n.id} — ${n.errors[0] ?? ''}`,
        }))}
        onSelect={select}
      />
      <IssueSection
        icon={<Clock size={14} />}
        title="Missing timestamp"
        count={insights.staleTimestamp.length}
        tone="muted"
        items={insights.staleTimestamp.map((id) => ({ id, label: id }))}
        onSelect={select}
      />
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface/60 px-3 py-2.5">
      <div className="font-display text-2xl font-semibold tabular-nums text-fg">{value}</div>
      <div className="text-xs text-faint">
        {label}
        {hint ? ` · ${hint}` : ''}
      </div>
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-faint">
        {icon}
        {title}
      </h3>
      {children}
    </section>
  );
}

const TONE: Record<string, string> = {
  warning: 'text-warning',
  danger: 'text-danger',
  muted: 'text-muted',
};

function IssueSection({
  icon,
  title,
  count,
  tone,
  items,
  onSelect,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  tone: 'warning' | 'danger' | 'muted';
  items: { id: string; label: string }[];
  onSelect: (id: string) => void;
}) {
  return (
    <section>
      <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-faint">
        {icon}
        {title}
        <span className={`ml-auto font-mono ${count > 0 ? TONE[tone] : 'text-faint'}`}>
          {count}
        </span>
      </h3>
      {count === 0 ? (
        <p className="text-xs text-faint">None 🎉</p>
      ) : (
        <ul className="space-y-0.5">
          {items.slice(0, 40).map((it) => (
            <li key={it.label}>
              <button
                type="button"
                onClick={() => onSelect(it.id)}
                className="block w-full truncate rounded px-2 py-1 text-left font-mono text-xs text-muted hover:bg-surface-2 hover:text-fg"
                title={it.label}
              >
                {it.label}
              </button>
            </li>
          ))}
          {items.length > 40 && (
            <li className="px-2 text-xs text-faint">+{items.length - 40} more</li>
          )}
        </ul>
      )}
    </section>
  );
}
