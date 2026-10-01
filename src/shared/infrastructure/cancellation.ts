import type { Cancellation } from '@/shared/application/cancellation';

/** Browser/Query signal -> inner port. Listener registration is lazy and owned by its subscriber. */
export function fromAbortSignal(signal: AbortSignal): Cancellation {
  return {
    get isCancellationRequested() {
      return signal.aborted;
    },
    subscribe(listener) {
      if (signal.aborted) {
        listener();
        return () => {};
      }
      signal.addEventListener('abort', listener, { once: true });
      return () => {
        signal.removeEventListener('abort', listener);
      };
    },
  };
}
/** Inner port -> transport signal; release the subscription on success, failure and cancellation. */
export async function withAbortSignal<T>(
  cancellation: Cancellation | undefined,
  operation: (signal?: AbortSignal) => Promise<T>,
): Promise<T> {
  if (!cancellation) return operation();
  const controller = new AbortController();
  const unsubscribe = cancellation.subscribe(() => {
    controller.abort();
  });
  try {
    if (cancellation.isCancellationRequested) controller.abort();
    return await operation(controller.signal);
  } finally {
    unsubscribe();
  }
}
