import { Logo } from '../../components/Logo';

export function LoadingState() {
  return (
    <div className="absolute inset-0 grid place-items-center">
      <div className="flex flex-col items-center gap-4 text-muted">
        <div className="animate-pulse">
          <Logo size={48} />
        </div>
        <p className="text-sm">Parsing the bundle…</p>
      </div>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="absolute inset-0 grid place-items-center p-8">
      <div className="max-w-md text-center">
        <h2 className="mb-2 font-display text-lg font-semibold text-fg">Something went wrong</h2>
        <p className="mb-5 text-sm text-muted">{message}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-fg hover:bg-surface-2"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}

export function EmptyState() {
  return (
    <div className="absolute inset-0 grid place-items-center p-8">
      <div className="max-w-md text-center">
        <div className="mb-4 flex justify-center opacity-80">
          <Logo size={56} />
        </div>
        <h2 className="mb-2 font-display text-lg font-semibold text-fg">No concepts found</h2>
        <p className="text-sm text-muted">
          Point Okapi at an OKF bundle directory containing markdown concept files.
        </p>
      </div>
    </div>
  );
}
