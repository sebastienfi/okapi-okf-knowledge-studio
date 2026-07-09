import { useCallback, useEffect, useState } from 'react';

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  citations?: string[];
  error?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

const keyFor = (scope: string) => `okapi:chats:${scope}`;

function loadAll(scope: string): Conversation[] {
  try {
    const raw = localStorage.getItem(keyFor(scope));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as Conversation[]) : [];
  } catch {
    return [];
  }
}

function saveAll(scope: string, list: Conversation[]): void {
  try {
    localStorage.setItem(keyFor(scope), JSON.stringify(list));
  } catch {
    // storage disabled/full — conversations just won't persist
  }
}

function uid(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `c${Date.now()}${Math.random().toString(16).slice(2)}`;
}

function titleFrom(text: string): string {
  const t = text.trim().replace(/\s+/g, ' ');
  return t.length > 48 ? `${t.slice(0, 48)}…` : t;
}

/**
 * localStorage-backed conversations, scoped per bundle. Streaming assistant text
 * is kept in component state and committed here only when a turn completes, so
 * we never thrash storage token-by-token.
 */
export function useConversations(scope: string) {
  const [conversations, setConversations] = useState<Conversation[]>(() => loadAll(scope));
  const [activeId, setActiveId] = useState<string | null>(() => loadAll(scope)[0]?.id ?? null);

  useEffect(() => {
    const list = loadAll(scope);
    setConversations(list);
    setActiveId(list[0]?.id ?? null);
  }, [scope]);

  const update = useCallback(
    (fn: (prev: Conversation[]) => Conversation[]) => {
      setConversations((prev) => {
        const next = fn(prev);
        saveAll(scope, next);
        return next;
      });
    },
    [scope],
  );

  const newConversation = useCallback((): string => {
    const id = uid();
    const now = Date.now();
    update((prev) => [
      { id, title: 'New conversation', messages: [], createdAt: now, updatedAt: now },
      ...prev,
    ]);
    setActiveId(id);
    return id;
  }, [update]);

  const selectConversation = useCallback((id: string) => setActiveId(id), []);

  const deleteConversation = useCallback(
    (id: string) => {
      update((prev) => prev.filter((c) => c.id !== id));
      setActiveId((cur) => (cur === id ? null : cur));
    },
    [update],
  );

  const addMessages = useCallback(
    (id: string, msgs: ChatMessage[]) => {
      const now = Date.now();
      update((prev) =>
        prev.map((c) => {
          if (c.id !== id) return c;
          const messages = [...c.messages, ...msgs];
          const firstUser = messages.find((m) => m.role === 'user');
          const title =
            c.title === 'New conversation' && firstUser ? titleFrom(firstUser.text) : c.title;
          return { ...c, messages, title, updatedAt: now };
        }),
      );
    },
    [update],
  );

  const active = conversations.find((c) => c.id === activeId) ?? null;

  return {
    conversations,
    activeId,
    active,
    newConversation,
    selectConversation,
    deleteConversation,
    addMessages,
  };
}
