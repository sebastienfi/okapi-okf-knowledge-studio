import yaml from 'js-yaml';

export interface SplitResult {
  /** Parsed frontmatter mapping (empty when absent or on error). */
  data: Record<string, unknown>;
  /** File content with the frontmatter block removed. */
  body: string;
  /** Whether an opening `---` fence was present. */
  hasFrontmatter: boolean;
  /** Set when the block is malformed (unterminated / not a mapping / invalid YAML). */
  parseError?: string;
}

const FENCE = '---';

/** Strip a leading UTF-8 BOM if present. */
export function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

/**
 * Split YAML frontmatter from a markdown file, mirroring the OKF reference
 * validator (`validate_okf.py` / `document.py`):
 *   - a file not starting with `---` has no frontmatter (all body);
 *   - a started-but-unterminated block is an error;
 *   - frontmatter must be a YAML mapping (not a list/scalar).
 * Never throws; malformed input is reported via `parseError`.
 */
export function splitFrontmatter(input: string): SplitResult {
  const text = stripBom(input);
  if (text.trimStart().slice(0, 3) !== FENCE) {
    return { data: {}, body: text, hasFrontmatter: false };
  }
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((l) => l.trim() !== '');
  let close = -1;
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i]?.trim() === FENCE) {
      close = i;
      break;
    }
  }
  if (close === -1) {
    return {
      data: {},
      body: text,
      hasFrontmatter: true,
      parseError: 'unterminated YAML frontmatter block',
    };
  }
  const block = lines.slice(start + 1, close).join('\n');
  const body = lines.slice(close + 1).join('\n');
  let parsed: unknown;
  try {
    parsed = block.trim() === '' ? {} : yaml.load(block);
  } catch (err) {
    return {
      data: {},
      body,
      hasFrontmatter: true,
      parseError: `invalid YAML frontmatter: ${(err as Error).message}`,
    };
  }
  if (parsed == null) parsed = {};
  if (typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {
      data: {},
      body,
      hasFrontmatter: true,
      parseError: 'frontmatter must be a YAML mapping',
    };
  }
  return { data: parsed as Record<string, unknown>, body, hasFrontmatter: true };
}

const OKF_VERSION_RE = /^okf_version:\s*["']?([^"'\n]+?)["']?\s*$/;

/**
 * Read the optional bundle-root `okf_version` marker. In the reference bundle
 * it appears as a bare line at the top of the root `index.md`, OUTSIDE any
 * frontmatter fence, so we scan the first few non-empty lines for it.
 */
export function readOkfVersion(rootIndexText: string): string | null {
  const lines = stripBom(rootIndexText).split(/\r?\n/);
  for (const line of lines) {
    if (line.trim() === '') continue;
    // The marker is only ever the first non-empty line; inspect just that line.
    const m = OKF_VERSION_RE.exec(line.trim());
    return m ? (m[1]?.trim() ?? null) : null;
  }
  return null;
}
