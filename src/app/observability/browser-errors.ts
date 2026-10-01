import type { ErrorReporter } from '@/shared/application/ports/error-reporter';
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
