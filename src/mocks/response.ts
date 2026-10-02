import type { ApiResponse } from '@/usecases/response';
export function success<T>(result: T): ApiResponse<T> {
  return { success: true, result, errorCode: null, errorDetails: null, message: null };
}
export function failure(message: string, code: string): ApiResponse<never> {
  return { success: false, result: null, errorCode: code, errorDetails: null, message };
}
