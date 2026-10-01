import { DomainError } from '@/shared/domain/domain-error';

export type ErrorKind =
  | 'validation'
  | 'network'
  | 'unauthorized'
  | 'forbidden'
  | 'not-found'
  | 'conflict'
  | 'rate-limit'
  | 'timeout'
  | 'contract'
  | 'server'
  | 'business';

interface ErrorOptions {
  readonly code?: string | number;
  readonly retryable?: boolean;
}
/** Application failure; adapters decide retry eligibility without exposing HTTP metadata. */
export class AppError extends Error {
  readonly code: string | number | undefined;
  readonly retryable: boolean;
  constructor(
    public readonly kind: ErrorKind,
    message: string,
    options: ErrorOptions = {},
  ) {
    super(message);
    this.name = 'AppError';
    this.code = options.code;
    this.retryable = options.retryable ?? false;
  }
}
export function getErrorKind(error: unknown): ErrorKind | 'unknown' {
  return error instanceof AppError || error instanceof DomainError ? error.kind : 'unknown';
}
