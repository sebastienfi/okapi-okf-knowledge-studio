import path from 'node:path';

/** External schemes (http:, mailto:, …), protocol-relative (//), pure anchors (#). */
const EXTERNAL_RE = /^(?:[a-z][a-z0-9+.\-]*:|\/\/|#)/i;

/**
 * Resolve a markdown link href to a bundle-root-relative `.md` target, mirroring
 * the OKF reference validator:
 *   - skip external / protocol-relative / pure-anchor links;
 *   - strip any `#fragment`;
 *   - a leading `/` resolves from the bundle root, otherwise from the linking
 *     file's directory;
 *   - reject targets that escape the bundle (`..`);
 *   - keep only `.md` targets.
 * Returns the normalized target path, or null if the link is not an in-bundle
 * `.md` reference. The caller decides edge-vs-broken by node-set membership.
 */
export function resolveTarget(rawUrl: string, sourceRelPath: string): string | null {
  const raw = rawUrl.trim();
  if (raw === '' || EXTERNAL_RE.test(raw)) return null;

  const withoutFragment = raw.split('#')[0] ?? '';
  if (withoutFragment === '') return null;

  const isAbsolute = withoutFragment.startsWith('/');
  const stripped = isAbsolute ? withoutFragment.slice(1) : withoutFragment;
  const sourceDir = path.posix.dirname(sourceRelPath);
  const base = isAbsolute || sourceDir === '.' ? '' : sourceDir;
  const joined = path.posix.normalize(path.posix.join(base, stripped));

  if (joined.startsWith('..') || joined.startsWith('/')) return null;
  if (!joined.endsWith('.md')) return null;
  return joined;
}
