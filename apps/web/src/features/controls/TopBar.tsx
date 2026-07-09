import { Gauge, Moon, Search, Sparkles, Sun } from 'lucide-react';
import { useAiStatus } from '../../api/client';
import type { BundleMeta } from '../../api/types';
import { Logo } from '../../components/Logo';
import { useAppStore } from '../../store/useAppStore';

export function TopBar({ meta }: { meta: BundleMeta }) {
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const setPaletteOpen = useAppStore((s) => s.setPaletteOpen);
  const openDock = useAppStore((s) => s.openDock);
  const { data: ai } = useAiStatus();

  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-surface/80 px-4 backdrop-blur">
      <div className="flex items-center gap-2.5">
        <Logo />
        <div className="leading-none">
          <div className="font-display text-[15px] font-semibold tracking-tight text-fg">Okapi</div>
        </div>
        <span className="ml-1 hidden truncate text-xs text-faint sm:inline">{meta.bundleName}</span>
      </div>

      <button
        type="button"
        onClick={() => setPaletteOpen(true)}
        className="group ml-2 flex h-9 max-w-md flex-1 items-center gap-2 rounded-lg border border-border bg-surface-2/60 px-3 text-sm text-faint transition-colors hover:border-border-strong"
      >
        <Search size={15} />
        <span>Search concepts…</span>
        <kbd className="ml-auto rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[11px] text-muted">
          {isMac ? '⌘' : 'Ctrl'} K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => openDock('insights')}
          className="flex h-9 items-center gap-1.5 rounded-lg border border-border px-2.5 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-fg"
          title="Bundle insights"
        >
          <Gauge size={15} />
          <span className="hidden lg:inline">Insights</span>
        </button>
        <button
          type="button"
          onClick={() => openDock('ask')}
          className={`hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors md:flex ${
            ai?.enabled
              ? 'border-brand/40 text-brand hover:bg-brand/10'
              : 'border-border text-faint hover:bg-surface-2 hover:text-muted'
          }`}
          title={
            ai?.enabled
              ? `AI on · ${ai.provider} · ${ai.model} — open Ask`
              : (ai?.reason ?? 'AI is off')
          }
        >
          <Sparkles size={13} />
          AI {ai?.enabled ? 'on' : 'off'}
        </button>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted transition-colors hover:bg-surface-2 hover:text-fg"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  );
}
