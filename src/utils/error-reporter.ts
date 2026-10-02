import { getErrorKind } from '@/usecases/app-error';
import { OperationCancelledError } from '@/usecases/app-error';
export interface DiagnosticEvent {
  readonly source: ErrorSource;
  readonly kind: ReturnType<typeof getErrorKind>;
  readonly timestamp: string;
}
/** Allowlist only: no messages, stack traces, URLs, headers, user IDs or payloads leave this boundary. */
export function createErrorReporter(
  sink?: (event: DiagnosticEvent) => void,
): ErrorReporter & { snapshot(): readonly DiagnosticEvent[] } {
  const events: DiagnosticEvent[] = [];
  return {
    report(error, source) {
      if (error instanceof OperationCancelledError) return;
      const event: DiagnosticEvent = {
        source,
        kind: getErrorKind(error),
        timestamp: new Date().toISOString(),
      };
      events.push(event);
      if (events.length > 50) events.shift();
      try {
        sink?.({ ...event });
      } catch {
        /* Reporting must never crash the application. */
      }
    },
    snapshot: () => events.map((event) => ({ ...event })),
  };
}

export type ErrorSource = 'react' | 'router' | 'query' | 'mutation' | 'window' | 'promise';
export interface ErrorReporter {
  report(error: unknown, source: ErrorSource): void;
}

export function observeBrowserErrors(
  reporter: ErrorReporter,
  target: EventTarget = window,
): () => void {
  const error = (event: Event) =>
    reporter.report('error' in event ? event.error : undefined, 'window');
  const rejection = (event: Event) =>
    reporter.report('reason' in event ? event.reason : undefined, 'promise');
  target.addEventListener('error', error);
  target.addEventListener('unhandledrejection', rejection);
  return () => {
    target.removeEventListener('error', error);
    target.removeEventListener('unhandledrejection', rejection);
  };
}
