export interface BundleEvent {
  type: 'bundle-changed';
  change: 'added' | 'updated' | 'removed' | 'rebuilt';
  path?: string;
  /** Client id of the save that triggered this, so the originating tab can ignore its echo. */
  originId?: string;
}

type Listener = (event: BundleEvent) => void;

/** Tiny in-process pub/sub hub connecting the watcher/save path to SSE clients. */
export class EventHub {
  private listeners = new Set<Listener>();

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  publish(event: BundleEvent): void {
    for (const listener of this.listeners) listener(event);
  }
}
