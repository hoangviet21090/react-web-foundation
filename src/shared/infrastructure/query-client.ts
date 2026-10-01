import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { AppError } from '@/shared/application/app-error';
import type { ErrorReporter } from '@/shared/application/ports/error-reporter';
export function createQueryClient(reporter?: ErrorReporter) {
  return new QueryClient({
    queryCache: new QueryCache({ onError: (error) => reporter?.report(error, 'query') }),
    mutationCache: new MutationCache({ onError: (error) => reporter?.report(error, 'mutation') }),
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: true,
        retry: (count, error) => count < 2 && error instanceof AppError && error.retryable,
      },
      mutations: { retry: false },
    },
  });
}
