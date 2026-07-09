import { ArrowLeft, ArrowRight, Check, Loader2, Pencil } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { type HttpError, useGraph, useNode, useSaveNode } from '../../api/client';
import type { Neighbor, NodeDetail } from '../../api/types';
import { cn } from '../../lib/cn';
import { type Theme, buildTypeColorMap, colorForType } from '../../lib/colorForType';
import { useAppStore } from '../../store/useAppStore';
import { EditorPane } from './EditorPane';
import { MarkdownView } from './MarkdownView';
import { MetaCard } from './MetaCard';

function stripFrontmatter(text: string): string {
  if (text.trimStart().slice(0, 3) !== '---') return text;
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((l) => l.trim() !== '');
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i]?.trim() === '---') return lines.slice(i + 1).join('\n');
  }
  return text;
}

export function DetailPanel({ nodeId }: { nodeId: string }) {
  const theme = useAppStore((s) => s.theme);
  const editing = useAppStore((s) => s.editing);
  const setEditing = useAppStore((s) => s.setEditing);
  const select = useAppStore((s) => s.select);
  const { data: graph } = useGraph();
  const { data: detail, isLoading, error } = useNode(nodeId);

  const colorMap = useMemo(
    () =>
      buildTypeColorMap(
        (graph?.meta.types ?? []).map((t) => t.type),
        theme,
      ),
    [graph?.meta.types, theme],
  );
  const existingIds = useMemo(() => new Set((graph?.nodes ?? []).map((n) => n.id)), [graph?.nodes]);

  if (isLoading || !detail) {
    return (
      <div className="p-6 text-sm text-muted">
        {error ? `Failed to load: ${(error as Error).message}` : 'Loading…'}
      </div>
    );
  }

  const { node } = detail;
  const color = colorForType(node.type, node.isSystem, colorMap, theme);

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-start gap-3 border-b border-border px-5 py-4">
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-display text-lg font-semibold leading-tight text-fg">
            {node.title}
          </h2>
          <div className="mt-1.5 flex items-center gap-1.5">
            {node.type && (
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                style={{ backgroundColor: `${color}22`, color }}
              >
                {node.type}
              </span>
            )}
            {node.isSystem && (
              <span className="inline-flex rounded-full bg-surface-2 px-2 py-0.5 text-xs text-muted">
                system · {node.systemKind}
              </span>
            )}
          </div>
        </div>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex h-8 items-center gap-1.5 rounded-md border border-border px-2.5 text-xs font-medium text-muted hover:bg-surface-2 hover:text-fg"
          >
            <Pencil size={13} /> Edit
          </button>
        )}
      </header>

      {editing ? (
        <EditView key={nodeId} detail={detail} theme={theme} onExit={() => setEditing(false)} />
      ) : (
        <ReadView
          detail={detail}
          colorMap={colorMap}
          theme={theme}
          existingIds={existingIds}
          onNavigate={select}
        />
      )}
    </div>
  );
}

function ReadView({
  detail,
  colorMap,
  theme,
  existingIds,
  onNavigate,
}: {
  detail: NodeDetail;
  colorMap: Map<string, string>;
  theme: Theme;
  existingIds: Set<string>;
  onNavigate: (id: string) => void;
}) {
  const { node, frontmatter, body, neighbors } = detail;
  const out = neighbors.filter((n) => n.direction === 'out');
  const incoming = neighbors.filter((n) => n.direction === 'in');

  return (
    <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
      {node.description && <p className="text-sm leading-relaxed text-muted">{node.description}</p>}
      <MetaCard node={node} frontmatter={frontmatter} />

      {(out.length > 0 || incoming.length > 0) && (
        <div className="space-y-3">
          {out.length > 0 && (
            <NeighborGroup
              label="Links to"
              icon={<ArrowRight size={13} />}
              neighbors={out}
              colorMap={colorMap}
              theme={theme}
              onNavigate={onNavigate}
            />
          )}
          {incoming.length > 0 && (
            <NeighborGroup
              label="Linked from"
              icon={<ArrowLeft size={13} />}
              neighbors={incoming}
              colorMap={colorMap}
              theme={theme}
              onNavigate={onNavigate}
            />
          )}
        </div>
      )}

      {body.trim() && (
        <section className="border-t border-border pt-4">
          <MarkdownView
            body={body}
            currentDir={node.dir}
            existingIds={existingIds}
            onNavigate={onNavigate}
          />
        </section>
      )}
    </div>
  );
}

type Mode = 'edit' | 'split' | 'preview';

function EditView({
  detail,
  theme,
  onExit,
}: {
  detail: NodeDetail;
  theme: Theme;
  onExit: () => void;
}) {
  const [draft, setDraft] = useState(detail.raw);
  const [savedContent, setSavedContent] = useState(detail.raw);
  const [baseHash, setBaseHash] = useState(detail.hash);
  const [mode, setMode] = useState<Mode>('split');
  const setDirty = useAppStore((s) => s.setDirty);
  const existingIds = useMemo(() => new Set<string>(), []);
  const save = useSaveNode();
  const dirty = draft !== savedContent;

  useEffect(() => {
    setDirty(dirty);
    return () => setDirty(false);
  }, [dirty, setDirty]);

  useEffect(() => {
    if (!dirty) return;
    const beforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [dirty]);

  const doSave = useCallback(() => {
    if (!dirty || save.isPending) return;
    save.mutate(
      { path: detail.node.id, content: draft, baseHash },
      {
        onSuccess: (d) => {
          setSavedContent(d.raw);
          setDraft(d.raw);
          setBaseHash(d.hash);
          toast.success('Saved');
        },
        onError: (e) => {
          const err = e as HttpError;
          if (err.status === 409)
            toast.error('File changed on disk — reload to get the latest version.');
          else toast.error(err.message || 'Save failed');
        },
      },
    );
  }, [dirty, save, detail.node.id, draft, baseHash]);

  const tryExit = () => {
    if (dirty && !window.confirm('Discard unsaved changes?')) return;
    onExit();
  };

  const previewBody = stripFrontmatter(draft);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2">
        <div className="flex rounded-md border border-border p-0.5 text-xs">
          {(['edit', 'split', 'preview'] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                'rounded px-2.5 py-1 capitalize',
                mode === m ? 'bg-surface-2 text-fg' : 'text-muted hover:text-fg',
              )}
            >
              {m}
            </button>
          ))}
        </div>
        {dirty && <span className="text-xs text-warning">● unsaved</span>}
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={tryExit}
            className="rounded-md px-2.5 py-1.5 text-xs text-muted hover:text-fg"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={doSave}
            disabled={!dirty || save.isPending}
            className="flex items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-brand-fg disabled:opacity-40"
          >
            {save.isPending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
            Save
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {mode !== 'preview' && (
          <div
            className={cn(
              'min-h-0 overflow-hidden',
              mode === 'split' ? 'w-1/2 border-r border-border' : 'flex-1',
            )}
          >
            <EditorPane value={draft} onChange={setDraft} onSave={doSave} theme={theme} />
          </div>
        )}
        {mode !== 'edit' && (
          <div
            className={cn(
              'min-h-0 overflow-y-auto px-5 py-4',
              mode === 'split' ? 'w-1/2' : 'flex-1',
            )}
          >
            <MarkdownView
              body={previewBody}
              currentDir={detail.node.dir}
              existingIds={existingIds}
              onNavigate={() => {}}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function NeighborGroup({
  label,
  icon,
  neighbors,
  colorMap,
  theme,
  onNavigate,
}: {
  label: string;
  icon: React.ReactNode;
  neighbors: Neighbor[];
  colorMap: Map<string, string>;
  theme: Theme;
  onNavigate: (id: string) => void;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-faint">
        {icon}
        {label}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {neighbors.map((n) => (
          <button
            key={`${n.direction}-${n.id}`}
            type="button"
            onClick={() => onNavigate(n.id)}
            className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-xs text-fg hover:border-border-strong hover:bg-surface-2"
          >
            <span
              className="size-2 rounded-[2px]"
              style={{ backgroundColor: colorForType(n.type, false, colorMap, theme) }}
            />
            {n.title}
          </button>
        ))}
      </div>
    </div>
  );
}
