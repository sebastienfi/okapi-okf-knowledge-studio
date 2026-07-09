import fs from 'node:fs/promises';
import path from 'node:path';

/** Raised when a requested path is not safely inside the bundle. */
export class PathError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PathError';
  }
}

/**
 * Resolve a client-supplied bundle-relative path to an absolute path that is
 * provably inside `root`. This is the single choke point every read/write goes
 * through. `root` MUST already be a realpath (resolved at boot).
 */
export function resolveInBundle(root: string, relPathRaw: string): string {
  let rel = relPathRaw;
  try {
    rel = decodeURIComponent(relPathRaw);
  } catch {
    // not URI-encoded; use as-is
  }
  if (rel.includes('\0')) throw new PathError('invalid path');
  rel = rel.replace(/\\/g, '/');
  if (path.posix.isAbsolute(rel) || path.win32.isAbsolute(rel)) {
    throw new PathError('absolute paths are not allowed');
  }
  const normalized = path.posix.normalize(rel);
  if (normalized.startsWith('..') || normalized.startsWith('/') || normalized === '.') {
    throw new PathError('path escapes the bundle');
  }
  const abs = path.resolve(root, normalized);
  if (abs !== root && !abs.startsWith(root + path.sep)) {
    throw new PathError('path escapes the bundle');
  }
  return abs;
}

/**
 * Defense-in-depth against symlink escape: the realpath of the file's existing
 * parent directory must still be inside the bundle root.
 */
export async function assertParentInsideBundle(root: string, absPath: string): Promise<void> {
  const parent = path.dirname(absPath);
  const realParent = await fs.realpath(parent);
  const realRoot = await fs.realpath(root);
  if (realParent !== realRoot && !realParent.startsWith(realRoot + path.sep)) {
    throw new PathError('path escapes the bundle via a symlink');
  }
}

/** Atomically write `content` to `absPath` (temp file + fsync + rename), preserving mode. */
export async function atomicWrite(absPath: string, content: string): Promise<void> {
  const dir = path.dirname(absPath);
  const tmp = path.join(dir, `.${path.basename(absPath)}.${process.pid}.${Date.now()}.tmp`);

  let mode: number | undefined;
  try {
    mode = (await fs.stat(absPath)).mode;
  } catch {
    // new file; use default mode
  }

  const handle = await fs.open(tmp, 'w');
  try {
    await handle.writeFile(content, 'utf8');
    await handle.sync();
  } finally {
    await handle.close();
  }
  await fs.rename(tmp, absPath);
  if (mode !== undefined) await fs.chmod(absPath, mode);
}
