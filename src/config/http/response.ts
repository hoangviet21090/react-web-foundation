import { z } from 'zod';
import { AppError } from '@/usecases/app-error';

import type { ApiResponse } from '@/usecases/response';

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
