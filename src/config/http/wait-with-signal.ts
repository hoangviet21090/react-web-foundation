import axios from 'axios';
import type { GenericAbortSignal } from 'axios';
/** Cancel one waiting caller without cancelling the refresh shared by other requests. */
export function waitWithSignal<T>(promise: Promise<T>, signal?: GenericAbortSignal): Promise<T> {
  if (!signal) return promise;
  if (signal.aborted) return Promise.reject(new axios.CanceledError('Request cancelled.'));
  return new Promise<T>((resolve, reject) => {
    const abort = () => {
      cleanup();
      reject(new axios.CanceledError('Request cancelled.'));
    };
    const cleanup = () => {
      signal.removeEventListener?.('abort', abort);
    };
    signal.addEventListener?.('abort', abort);
    promise.then(
      (value) => {
        cleanup();
        resolve(value);
      },
      (error: unknown) => {
        cleanup();
        reject(error instanceof Error ? error : new Error('Request failed.'));
      },
    );
  });
}
