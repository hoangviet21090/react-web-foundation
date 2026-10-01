import { getErrorKind } from '@/shared/application/app-error';
import { OperationCancelledError } from '@/shared/application/cancellation';
import type { ErrorReporter, ErrorSource } from '@/shared/application/ports/error-reporter';
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
