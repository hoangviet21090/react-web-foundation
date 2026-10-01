import { useContext } from 'react';
import { DiagnosticsContext } from './diagnostics-context';
export function useErrorReporter() {
  const reporter = useContext(DiagnosticsContext);
  if (!reporter) throw new Error('DiagnosticsContext is required.');
  return reporter;
}
