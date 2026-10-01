import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { OperationCancelledError } from '@/shared/application/cancellation';
import { AppError } from '@/shared/application/app-error';
import type { ErrorReporter } from '@/shared/application/ports/error-reporter';
export interface QueryScope {
  assertCurrent(): void;
}

// Clearing a session cache also invalidates mutation callbacks already awaiting async work.
class ScopedQueryCache extends QueryCache {
  private generation = 0;
  captureScope(): QueryScope {
    const generation = this.generation;
    return {
      assertCurrent: () => {
        if (generation !== this.generation) throw new OperationCancelledError();
      },
    };
  }
  override clear() {
    this.generation += 1;
    super.clear();
  }
}
export function captureQueryScope(client: QueryClient): QueryScope {
  const cache = client.getQueryCache();
  if (!(cache instanceof ScopedQueryCache)) {
    throw new AppError(
      'contract',
      'Use the application query-client factory for scoped mutations.',
    );
  }
  return cache.captureScope();
}
export function createQueryClient(reporter?: ErrorReporter) {
  return new QueryClient({
    queryCache: new ScopedQueryCache({ onError: (error) => reporter?.report(error, 'query') }),
    mutationCache: new MutationCache({ onError: (error) => reporter?.report(error, 'mutation') }),
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: true,
        retry: (count, error) => count < 2 && error instanceof AppError && error.retryable,
      },
      // Run mutation preconditions immediately, instead of silently queuing a write while offline.
      // Network writes must still call requireOnline (or their equivalent contract precondition).
      mutations: { retry: false, networkMode: 'always' },
    },
  });
}
