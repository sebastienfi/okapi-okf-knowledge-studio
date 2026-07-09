import {
  ArrowUp,
  ChevronDown,
  Loader2,
  MessagesSquare,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { type AiStatus, useAiStatus, useGraph } from '../../api/client';
import { askBundle } from '../../lib/askStream';
import { cn } from '../../lib/cn';
import { buildTypeColorMap, colorForType } from '../../lib/colorForType';
import { useConversations } from '../../lib/conversations';
import { useAppStore } from '../../store/useAppStore';
import { MarkdownView } from '../detail/MarkdownView';

/**
 * "Ask the bundle" panel. When AI is disabled it shows an opt-in explainer;
 * when enabled it streams grounded answers with citations that focus the graph,
 * across multiple resumable, bundle-scoped conversations.
 */
export function AskPanel() {
  const { data: ai } = useAiStatus();

  if (!ai?.enabled) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
        <div className="grid size-12 place-items-center rounded-full border border-border text-brand">
          <Sparkles size={22} />
        </div>
        <h3 className="font-display text-base font-semibold text-fg">Ask the bundle</h3>
        <p className="text-sm text-muted">
          Ask questions in plain English and get answers grounded in this bundle, with citations
          that highlight the relevant concepts on the graph.
        </p>
        <p className="text-xs text-faint">
          {ai?.reason ??
            'AI is off. Set OPENAI_API_KEY or ANTHROPIC_API_KEY and restart Okapi with --ai.'}
        </p>
      </div>
    );
  }

  return <AskChat ai={ai} />;
}

function AskChat({ ai }: { ai: AiStatus }) {
  const theme = useAppStore((s) => s.theme);
  const select = useAppStore((s) => s.select);
  const setHovered = useAppStore((s) => s.setHovered);
  const { data: graph } = useGraph();
  const scope = graph?.meta.bundleName ?? 'default';
  const conv = useConversations(scope);

  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [streaming, setStreaming] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const existingIds = useMemo(() => new Set((graph?.nodes ?? []).map((n) => n.id)), [graph?.nodes]);
  const colorMap = useMemo(
    () =>
      buildTypeColorMap(
        (graph?.meta.types ?? []).map((t) => t.type),
        theme,
      ),
    [graph?.meta.types, theme],
  );

  const scrollToEnd = () => {
    requestAnimationFrame(() =>
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }),
    );
  };

  const messages = conv.active?.messages ?? [];

  const submit = async () => {
    const q = input.trim();
    if (!q || busy) return;
    const id = conv.activeId ?? conv.newConversation();
    const history = (conv.active?.messages ?? [])
      .filter((m) => !m.error)
      .map((m) => ({ role: m.role, content: m.text }));

    conv.addMessages(id, [{ role: 'user', text: q }]);
    setInput('');
    setBusy(true);
    setStreaming('');
    scrollToEnd();

    let acc = '';
    let citations: string[] | undefined;
    try {
      await askBundle(q, {
        history,
        onToken: (t) => {
          acc += t;
          setStreaming(acc);
          scrollToEnd();
        },
        onCitations: (paths) => {
          citations = paths;
        },
      });
      conv.addMessages(id, [{ role: 'assistant', text: acc, citations }]);
    } catch (err) {
      conv.addMessages(id, [{ role: 'assistant', text: (err as Error).message, error: true }]);
    } finally {
      setStreaming(null);
      setBusy(false);
      scrollToEnd();
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Conversation switcher */}
      <div className="relative flex items-center gap-2 border-b border-border px-3 py-2">
        <button
          type="button"
          onClick={() => setPickerOpen((o) => !o)}
          className="flex min-w-0 flex-1 items-center gap-1.5 rounded-md px-2 py-1 text-left text-sm hover:bg-surface-2"
        >
          <MessagesSquare size={14} className="shrink-0 text-faint" />
          <span className="truncate text-fg">{conv.active?.title ?? 'New conversation'}</span>
          <ChevronDown size={14} className="ml-auto shrink-0 text-faint" />
        </button>
        <button
          type="button"
          onClick={() => {
            conv.newConversation();
            setStreaming(null);
            setPickerOpen(false);
          }}
          title="New conversation"
          className="grid size-7 shrink-0 place-items-center rounded-md border border-border text-muted hover:bg-surface-2 hover:text-fg"
        >
          <Plus size={15} />
        </button>

        {pickerOpen && (
          <>
            <button
              type="button"
              aria-label="Close"
              className="fixed inset-0 z-10 cursor-default"
              onClick={() => setPickerOpen(false)}
            />
            <div className="absolute inset-x-3 top-full z-20 mt-1 max-h-72 overflow-y-auto rounded-lg border border-border-strong bg-surface p-1 shadow-2xl">
              {conv.conversations.length === 0 ? (
                <div className="px-2 py-2 text-xs text-faint">No conversations yet.</div>
              ) : (
                conv.conversations.map((c) => (
                  <div
                    key={c.id}
                    className="group flex items-center gap-1 rounded-md hover:bg-surface-2"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        conv.selectConversation(c.id);
                        setPickerOpen(false);
                      }}
                      className={cn(
                        'min-w-0 flex-1 truncate px-2 py-1.5 text-left text-sm',
                        c.id === conv.activeId ? 'text-fg' : 'text-muted',
                      )}
                    >
                      {c.title}
                    </button>
                    <button
                      type="button"
                      onClick={() => conv.deleteConversation(c.id)}
                      title="Delete conversation"
                      className="mr-1 hidden shrink-0 text-faint hover:text-danger group-hover:block"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* Model label */}
      <div className="flex items-center gap-1.5 border-b border-border px-4 py-1 text-[11px] text-faint">
        <Sparkles size={11} className="text-brand" />
        <span className="font-mono">
          {ai.provider} · {ai.model}
        </span>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.length === 0 && streaming === null && (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-faint">
            <Sparkles size={20} className="text-brand" />
            Ask anything about this bundle.
          </div>
        )}
        {messages.map((msg, i) =>
          msg.role === 'user' ? (
            <div key={`${conv.activeId}-${i}`} className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-brand px-3.5 py-2 text-sm text-brand-fg">
                {msg.text}
              </div>
            </div>
          ) : (
            <div key={`${conv.activeId}-${i}`} className="space-y-2">
              {msg.error ? (
                <p className="text-sm text-danger">{msg.text}</p>
              ) : (
                <MarkdownView
                  body={msg.text}
                  currentDir=""
                  existingIds={existingIds}
                  onNavigate={select}
                />
              )}
              {msg.citations && msg.citations.length > 0 && (
                <Citations
                  paths={msg.citations}
                  colorMap={colorMap}
                  theme={theme}
                  onSelect={select}
                  onHover={setHovered}
                  nodes={graph?.nodes ?? []}
                />
              )}
            </div>
          ),
        )}
        {streaming !== null && (
          <div>
            {streaming ? (
              <MarkdownView
                body={streaming}
                currentDir=""
                existingIds={existingIds}
                onNavigate={select}
              />
            ) : (
              <Loader2 size={16} className="animate-spin text-faint" />
            )}
          </div>
        )}
      </div>

      <form
        className="border-t border-border p-3"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <div className="flex items-end gap-2 rounded-xl border border-border bg-surface-2/60 p-2 focus-within:border-border-strong">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void submit();
              }
            }}
            rows={1}
            placeholder="Ask the bundle…"
            className="max-h-32 min-h-[1.5rem] flex-1 resize-none bg-transparent px-1.5 text-sm text-fg outline-none placeholder:text-faint"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand text-brand-fg disabled:opacity-40"
          >
            {busy ? <Loader2 size={15} className="animate-spin" /> : <ArrowUp size={16} />}
          </button>
        </div>
      </form>
    </div>
  );
}

function Citations({
  paths,
  colorMap,
  theme,
  onSelect,
  onHover,
  nodes,
}: {
  paths: string[];
  colorMap: Map<string, string>;
  theme: 'dark' | 'light';
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
  nodes: { id: string; title: string; type: string | null }[];
}) {
  return (
    <div className="flex flex-wrap gap-1.5 pt-1">
      {paths.map((id) => {
        const node = nodes.find((n) => n.id === id);
        return (
          <button
            key={id}
            type="button"
            onMouseEnter={() => onHover(id)}
            onMouseLeave={() => onHover(null)}
            onClick={() => onSelect(id)}
            className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-xs text-fg hover:border-border-strong hover:bg-surface-2"
          >
            <span
              className="size-2 rounded-[2px]"
              style={{ backgroundColor: colorForType(node?.type ?? null, false, colorMap, theme) }}
            />
            {node?.title ?? id}
          </button>
        );
      })}
    </div>
  );
}
