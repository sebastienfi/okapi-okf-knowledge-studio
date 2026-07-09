import { Check, Copy, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import type { GraphNode } from '../../api/types';

function relativeTime(iso: string | null): string | null {
  if (!iso) return null;
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return iso;
  const diff = Date.now() - then;
  const days = Math.round(diff / 86_400_000);
  if (Math.abs(days) < 1) return 'today';
  if (Math.abs(days) < 30) return `${days}d ago`;
  const months = Math.round(days / 30);
  if (Math.abs(months) < 12) return `${months}mo ago`;
  return `${Math.round(months / 12)}y ago`;
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
      className="shrink-0 text-faint hover:text-fg"
      title="Copy"
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
    </button>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 px-3 py-2 text-sm">
      <span className="w-20 shrink-0 text-xs uppercase tracking-wide text-faint">{label}</span>
      <div className="min-w-0 flex-1 text-fg">{children}</div>
    </div>
  );
}

export function MetaCard({
  node,
  frontmatter,
}: {
  node: GraphNode;
  frontmatter: Record<string, unknown>;
}) {
  const known = new Set(['type', 'title', 'description', 'resource', 'tags', 'timestamp']);
  const extra = Object.entries(frontmatter).filter(([k]) => !known.has(k));
  const rel = relativeTime(node.timestamp);

  return (
    <div className="divide-y divide-border rounded-lg border border-border bg-surface/60">
      {node.path && (
        <Row label="Path">
          <div className="flex items-center gap-2">
            <code className="min-w-0 truncate font-mono text-xs text-muted">{node.path}</code>
            <CopyButton value={node.path} />
          </div>
        </Row>
      )}
      {node.tags.length > 0 && (
        <Row label="Tags">
          <div className="flex flex-wrap gap-1.5">
            {node.tags.map((t) => (
              <span
                key={t}
                className="rounded-full border border-border bg-surface-2 px-2 py-0.5 text-xs text-muted"
              >
                {t}
              </span>
            ))}
          </div>
        </Row>
      )}
      {node.resource && (
        <Row label="Resource">
          <div className="flex items-center gap-2">
            <span className="min-w-0 truncate font-mono text-xs text-muted">{node.resource}</span>
            <CopyButton value={node.resource} />
          </div>
        </Row>
      )}
      {rel && (
        <Row label="Updated">
          <span title={node.timestamp ?? ''}>{rel}</span>
        </Row>
      )}
      <Row label="Links">
        <span className="font-mono text-xs text-muted">
          {node.outDegree} out · {node.inDegree} in
        </span>
      </Row>
      {node.brokenLinks.length > 0 && (
        <Row label="Broken">
          <span className="text-xs text-warning">{node.brokenLinks.length} dangling link(s)</span>
        </Row>
      )}
      {extra.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer px-3 py-2 text-xs uppercase tracking-wide text-faint hover:text-muted">
            More metadata ({extra.length})
          </summary>
          <div className="divide-y divide-border border-t border-border">
            {extra.map(([k, v]) => (
              <Row key={k} label={k}>
                <code className="break-words font-mono text-xs text-muted">
                  {typeof v === 'string' ? v : JSON.stringify(v)}
                </code>
              </Row>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
