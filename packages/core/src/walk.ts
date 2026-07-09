import path from 'node:path';
import fg from 'fast-glob';

/**
 * Return every `.md` file under `root` as a sorted list of bundle-root-relative
 * POSIX paths. Symlinks are not followed (containment + loop safety), and the
 * usual noise directories are ignored.
 */
export async function walkMarkdown(root: string): Promise<string[]> {
  const entries = await fg('**/*.md', {
    cwd: root,
    onlyFiles: true,
    followSymbolicLinks: false,
    dot: false,
    ignore: ['**/node_modules/**', '**/.git/**', '**/.okapi/**'],
  });
  return entries.map((e) => e.split(path.sep).join('/')).sort();
}
