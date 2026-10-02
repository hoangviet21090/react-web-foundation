import { AppError } from '@/usecases/app-error';
/** No queued writes: an offline click must not submit later without the user. */
export function requireOnline(): void {
  if (!navigator.onLine) throw new AppError('network', 'Connection is unavailable.');
}
