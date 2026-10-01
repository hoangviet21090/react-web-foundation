export type ErrorSource = 'react' | 'router' | 'query' | 'mutation' | 'window' | 'promise';
export interface ErrorReporter {
  report(error: unknown, source: ErrorSource): void;
}
