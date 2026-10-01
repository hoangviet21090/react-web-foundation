/** Platform-independent cancellation contract owned by use cases. */
export interface Cancellation {
  readonly isCancellationRequested: boolean;
  /** Notify once on cancellation, immediately if already cancelled. Return an unsubscribe function. */
  subscribe(listener: () => void): () => void;
}
export class OperationCancelledError extends Error {
  constructor() {
    super('Operation cancelled.');
    this.name = 'OperationCancelledError';
  }
}
