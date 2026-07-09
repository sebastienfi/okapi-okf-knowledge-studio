export type Theme = 'dark' | 'light';

// Colorblind-safe categorical hues (Okabe-Ito + Paul Tol), tuned per theme:
// brighter/higher-chroma on the near-black canvas, deeper on white.
const PALETTE_DARK = [
  '#6AA9FF', // blue
  '#F0A94C', // orange
  '#5FD0A6', // green
  '#E58CC0', // pink
  '#7CC6F2', // sky
  '#F07A54', // vermillion
  '#C7B6FF', // violet
  '#5AC8C8', // teal
  '#D8C86A', // sand
  '#E06B8B', // wine
  '#9BE08A', // olive-green
  '#F2C14E', // amber
];

const PALETTE_LIGHT = [
  '#2166C4',
  '#B96B00',
  '#178A5E',
  '#B5468A',
  '#2E86C1',
  '#C24A1E',
  '#5B4BD6',
  '#1E8F8F',
  '#8A7A1E',
  '#B03A5B',
  '#3E8E3E',
  '#B7791F',
];

const SYSTEM_COLOR: Record<Theme, string> = { dark: '#7b818f', light: '#9096a2' };
const UNKNOWN_COLOR: Record<Theme, string> = { dark: '#5b6472', light: '#a2a8b4' };

/**
 * Build a deterministic, stable type -> color map. Types are sorted so a small
 * bundle gets maximally-separated hues and the assignment never changes across
 * reloads; beyond the palette length it wraps (redundant encoding elsewhere).
 */
export function buildTypeColorMap(types: string[], theme: Theme): Map<string, string> {
  const palette = theme === 'light' ? PALETTE_LIGHT : PALETTE_DARK;
  const sorted = [...new Set(types)].sort((a, b) => a.localeCompare(b));
  const map = new Map<string, string>();
  sorted.forEach((type, i) => {
    map.set(type, palette[i % palette.length] as string);
  });
  return map;
}

export function colorForType(
  type: string | null,
  isSystem: boolean,
  map: Map<string, string>,
  theme: Theme,
): string {
  if (isSystem) return SYSTEM_COLOR[theme];
  if (!type) return UNKNOWN_COLOR[theme];
  return map.get(type) ?? UNKNOWN_COLOR[theme];
}

export const systemColor = (theme: Theme): string => SYSTEM_COLOR[theme];
