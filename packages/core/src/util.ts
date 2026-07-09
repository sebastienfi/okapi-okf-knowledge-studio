/** Turn a filename stem into a human title, e.g. "file-hotspots" -> "File Hotspots". */
export function humanizeTitle(stem: string): string {
  return stem
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Coerce a frontmatter value to a display string (Dates -> ISO), else null. */
export function coerceString(value: unknown): string | null {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') return value.trim() === '' ? null : value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return null;
}

/** Coerce a frontmatter value to a string array (accepts a scalar or a list). */
export function coerceStringArray(value: unknown): string[] {
  if (value == null) return [];
  const arr = Array.isArray(value) ? value : [value];
  return arr
    .map((v) =>
      v instanceof Date ? v.toISOString() : typeof v === 'string' ? v : v == null ? '' : String(v),
    )
    .map((s) => s.trim())
    .filter((s) => s !== '');
}
