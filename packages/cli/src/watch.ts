import path from 'node:path';
import chokidar, { type FSWatcher } from 'chokidar';
import type { Bundle } from './bundle';
import type { BundleEvent, EventHub } from './sse';

const IGNORED_DIRS = new Set(['node_modules', '.git', '.okapi']);

/**
 * Watches the bundle for `.md` changes and rebuilds + broadcasts on change.
 * chokidar v4 has no glob support, so we watch the root and filter in `ignored`.
 */
export class Watcher {
  private watcher: FSWatcher | null = null;
  private selfWrites = new Map<string, number>();
  private timer: NodeJS.Timeout | null = null;
  private pending: BundleEvent['change'] = 'rebuilt';
  private pendingPath: string | undefined;

  constructor(
    private readonly bundle: Bundle,
    private readonly hub: EventHub,
  ) {}

  /** Note a path we just wrote ourselves, so we can ignore chokidar's echo of it. */
  markSelfWrite(relPath: string): void {
    this.selfWrites.set(relPath, Date.now() + 2000);
  }

  start(): void {
    const root = this.bundle.root;
    this.watcher = chokidar.watch(root, {
      ignoreInitial: true,
      ignored: (p: string, stats?: { isFile(): boolean }) => {
        if (p === root) return false;
        const base = path.basename(p);
        if (base.startsWith('.')) return true;
        if (IGNORED_DIRS.has(base)) return true;
        if (stats?.isFile() && !p.endsWith('.md')) return true;
        return false;
      },
    });

    const handle = (change: BundleEvent['change']) => (abs: string) => {
      const rel = path.relative(root, abs).split(path.sep).join('/');
      const until = this.selfWrites.get(rel);
      if (until && Date.now() < until) {
        this.selfWrites.delete(rel);
        return;
      }
      this.schedule(change, rel);
    };

    this.watcher
      .on('add', handle('added'))
      .on('change', handle('updated'))
      .on('unlink', handle('removed'));
  }

  private schedule(change: BundleEvent['change'], rel: string): void {
    this.pending = change;
    this.pendingPath = rel;
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(async () => {
      this.timer = null;
      await this.bundle.rebuild();
      this.hub.publish({ type: 'bundle-changed', change: this.pending, path: this.pendingPath });
    }, 200);
  }

  async stop(): Promise<void> {
    if (this.timer) clearTimeout(this.timer);
    await this.watcher?.close();
    this.watcher = null;
  }
}
