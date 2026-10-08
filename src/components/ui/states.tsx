import { Button } from "@/components/ui/button";

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="space-y-3 p-5" role="status" aria-live="polite">
      <div className="h-4 w-1/3 animate-pulse rounded bg-line" />
      <div className="h-4 w-full animate-pulse rounded bg-line" />
      <div className="h-4 w-2/3 animate-pulse rounded bg-line" />
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function Empty({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="px-5 py-10 text-center">
      <p className="font-medium">{title}</p>
      {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="px-5 py-8 text-center" role="alert">
      <p className="font-medium text-danger">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-3" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

/** Renders loading / error / content from a useLive result. */
export function Async<T>({
  state,
  children,
}: {
  state: { data: T | undefined; error: string | null; loading: boolean; refresh: () => void };
  children: (data: T) => React.ReactNode;
}) {
  if (state.loading) return <Loading />;
  if (state.error && state.data === undefined) return <ErrorState message={state.error} onRetry={state.refresh} />;
  if (state.data === undefined) return null;
  return <>{children(state.data)}</>;
}
