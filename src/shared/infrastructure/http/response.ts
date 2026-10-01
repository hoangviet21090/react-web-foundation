import { z } from 'zod';
import { AppError } from '@/shared/application/app-error';

/** Proposed transport envelope; repositories map its result into domain objects. */
export interface ApiResponse<TResult> {
  success: boolean;
  result: TResult | null;
  errorCode: string | number | null;
  errorDetails: string | null;
  message: string | null;
}
export interface PaginatedResult<TItem> {
  items: TItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}
const envelopeSchema = z.object({
  success: z.boolean(),
  result: z.unknown(),
  errorCode: z.union([z.string(), z.number(), z.null()]),
  errorDetails: z.string().nullable(),
  message: z.string().nullable(),
});
export function parseResponse<T>(value: unknown, resultSchema: z.ZodType<T>): ApiResponse<T> {
  const parsed = envelopeSchema.safeParse(value);
  if (!parsed.success || !Object.prototype.hasOwnProperty.call(value, 'result')) {
    throw new AppError('contract', 'Invalid response envelope.');
  }
  if (!parsed.data.success) {
    if (parsed.data.result !== null) throw new AppError('contract', 'Failure result must be null.');
    return { ...parsed.data, result: null };
  }
  const result = resultSchema.safeParse(parsed.data.result);
  if (!result.success) throw new AppError('contract', 'Invalid response result.');
  return { ...parsed.data, result: result.data };
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
