import type { Theme } from './colorForType';

export interface ResolvedThemeColors {
  brand: string;
  edge: string;
  edgeStrong: string;
  fg: string;
  muted: string;
  canvas: string;
  surface: string;
}

function readVar(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

/** Resolve CSS design tokens to concrete color strings (canvas needs literals). */
export function resolveThemeColors(_theme: Theme): ResolvedThemeColors {
  return {
    brand: readVar('--k-brand', '#8b8bf5'),
    edge: readVar('--k-graph-edge', 'rgba(255,255,255,0.13)'),
    edgeStrong: readVar('--k-graph-edge-strong', 'rgba(255,255,255,0.4)'),
    fg: readVar('--k-fg', '#ecedf1'),
    muted: readVar('--k-muted', '#9aa0ae'),
    canvas: readVar('--k-canvas', '#0a0a0e'),
    surface: readVar('--k-surface', '#121218'),
  };
}

/** #rrggbb -> rgba(...) with the given alpha. Passes through non-hex inputs. */
export function withAlpha(hex: string, alpha: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const int = Number.parseInt(m[1] as string, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
