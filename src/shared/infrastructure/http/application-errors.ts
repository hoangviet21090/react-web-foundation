import axios from 'axios';
import { AppError } from '@/shared/application/app-error';
import { OperationCancelledError } from '@/shared/application/cancellation';
import { DomainError } from '@/shared/domain/domain-error';
import { HttpError } from './http-error';

/** Repository boundary: only platform-independent errors cross into use cases. */
export async function withApplicationErrors<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (axios.isCancel(error)) throw new OperationCancelledError();
    if (error instanceof HttpError) {
      throw new AppError(error.kind, 'The request could not be completed.', {
        retryable: error.kind === 'network' || (error.status !== undefined && error.status >= 500),
      });
    }
    if (
      error instanceof AppError ||
      error instanceof DomainError ||
      error instanceof OperationCancelledError
    )
      throw error;
    throw new AppError('server', 'The request could not be completed.');
  }
}
