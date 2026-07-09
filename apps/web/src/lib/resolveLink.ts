export type ResolvedLink =
  | { kind: 'node'; id: string }
  | { kind: 'asset'; path: string }
  | { kind: 'external'; href: string };

const EXTERNAL = /^(?:[a-z][a-z0-9+.\-]*:|\/\/|#)/i;

function normalizePosix(p: string): string {
  const out: string[] = [];
  for (const part of p.split('/')) {
    if (part === '' || part === '.') continue;
    if (part === '..') {
      if (out.length && out[out.length - 1] !== '..') out.pop();
      else out.push('..');
    } else {
      out.push(part);
    }
  }
  return out.join('/');
}

/**
 * Resolve a markdown href (as written in a concept body) relative to the
 * linking file's directory, mirroring the parser's rules. Used to turn internal
 * `.md` links into in-app graph navigation and asset links into /api/files.
 */
export function resolveLink(href: string, currentDir: string): ResolvedLink {
  const raw = href.trim();
  if (!raw || EXTERNAL.test(raw)) return { kind: 'external', href: raw };
  const noFrag = raw.split('#')[0] ?? '';
  if (!noFrag) return { kind: 'external', href: raw };

  const isAbsolute = noFrag.startsWith('/');
  const stripped = isAbsolute ? noFrag.slice(1) : noFrag;
  const base = isAbsolute || currentDir === '' ? '' : currentDir;
  const joined = normalizePosix(base ? `${base}/${stripped}` : stripped);

  if (joined.startsWith('..')) return { kind: 'external', href: raw };
  if (joined.endsWith('.md')) return { kind: 'node', id: joined };
  return { kind: 'asset', path: joined };
}
