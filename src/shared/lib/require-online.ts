import { AppError } from '@/shared/application/app-error';
/** No queued writes: an offline click must not submit later without the user. */
export function requireOnline(): void {
  if (!navigator.onLine) throw new AppError('network', 'Connection is unavailable.');
}
