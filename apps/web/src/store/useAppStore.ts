import { create } from 'zustand';
import type { Theme } from '../lib/colorForType';

export type DockTab = 'detail' | 'ask' | 'insights';

interface AppState {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;

  /** Selected node id (also synced to the URL hash). */
  selectedId: string | null;
  select: (id: string | null) => void;

  dockOpen: boolean;
  openDock: (tab: DockTab) => void;
  closeDock: () => void;

  hoveredId: string | null;
  setHovered: (id: string | null) => void;

  /** Types the user has toggled OFF (empty = all visible). */
  disabledTypes: Set<string>;
  toggleType: (type: string) => void;
  setOnlyType: (type: string, allTypes: string[]) => void;
  showAllTypes: () => void;

  showSystem: boolean;
  toggleSystem: () => void;

  query: string;
  setQuery: (q: string) => void;

  paletteOpen: boolean;
  setPaletteOpen: (open: boolean) => void;

  dockTab: DockTab;
  setDockTab: (tab: DockTab) => void;

  editing: boolean;
  setEditing: (editing: boolean) => void;
  dirty: boolean;
  setDirty: (dirty: boolean) => void;

  /** Bumped to ask the graph to re-fit / re-center. */
  fitSignal: number;
  requestFit: () => void;
}

function initialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  const saved = window.localStorage.getItem('okapi-theme');
  return saved === 'light' || saved === 'dark' ? saved : 'dark';
}

export const useAppStore = create<AppState>((set, get) => ({
  theme: initialTheme(),
  setTheme: (theme) => {
    if (typeof window !== 'undefined') window.localStorage.setItem('okapi-theme', theme);
    document.documentElement.dataset.theme = theme;
    set({ theme });
  },
  toggleTheme: () => get().setTheme(get().theme === 'dark' ? 'light' : 'dark'),

  selectedId: null,
  select: (id) =>
    set((s) => ({
      selectedId: id,
      editing: false,
      dockTab: id ? 'detail' : s.dockTab,
      dockOpen: id ? true : s.dockTab === 'detail' ? false : s.dockOpen,
    })),

  dockOpen: false,
  openDock: (tab) => set({ dockOpen: true, dockTab: tab }),
  closeDock: () => set({ dockOpen: false, editing: false, selectedId: null }),

  hoveredId: null,
  setHovered: (id) => set({ hoveredId: id }),

  disabledTypes: new Set(),
  toggleType: (type) =>
    set((s) => {
      const next = new Set(s.disabledTypes);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return { disabledTypes: next };
    }),
  setOnlyType: (type, allTypes) =>
    set({ disabledTypes: new Set(allTypes.filter((t) => t !== type)) }),
  showAllTypes: () => set({ disabledTypes: new Set() }),

  showSystem: false,
  toggleSystem: () => set((s) => ({ showSystem: !s.showSystem })),

  query: '',
  setQuery: (query) => set({ query }),

  paletteOpen: false,
  setPaletteOpen: (paletteOpen) => set({ paletteOpen }),

  dockTab: 'detail',
  setDockTab: (dockTab) => set({ dockTab }),

  editing: false,
  setEditing: (editing) => set({ editing }),
  dirty: false,
  setDirty: (dirty) => set({ dirty }),

  fitSignal: 0,
  requestFit: () => set((s) => ({ fitSignal: s.fitSignal + 1 })),
}));
