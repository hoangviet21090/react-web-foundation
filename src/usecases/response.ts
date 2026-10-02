import { AppError } from '@/usecases/app-error';

export interface ApiResponse<TResult> {
  success: boolean;
  result: TResult | null;
  errorCode: string | number | null;
  errorDetails: string | null;
  message: string | null;
}

export function requireResult<T>(response: ApiResponse<T>): T {
  if (!response.success) {
    throw new AppError(
      'business',
      response.message ?? 'The request was rejected.',
      response.errorCode === null ? {} : { code: response.errorCode },
    );
  }
  if (response.result === null) throw new AppError('contract', 'Missing successful result.');
  return response.result;
}
