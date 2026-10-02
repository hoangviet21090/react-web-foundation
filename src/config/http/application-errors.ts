import axios from 'axios';
import { AppError } from '@/usecases/app-error';
import { OperationCancelledError } from '@/usecases/app-error';
import { DomainError } from '@/entities/domain-error';
import { HttpError } from '@/config/http/http-error';

/** Map transport failures once, without exposing Axios request data to consumers. */
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
