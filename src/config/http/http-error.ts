import type { ErrorKind } from '@/usecases/app-error';
/** Sanitized transport error. Never retain Axios config, body, headers or raw cause. */
export class HttpError extends Error {
  constructor(
    public readonly kind: ErrorKind,
    public readonly status?: number,
  ) {
    super('The request could not be completed.');
    this.name = 'HttpError';
  }
}
