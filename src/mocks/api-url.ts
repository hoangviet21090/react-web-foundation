import { env } from '@/shared/infrastructure/config/env';
export function mockUrl(path: string) {
  const origin = typeof window === 'undefined' ? 'http://localhost' : window.location.origin;
  return new URL(env.VITE_API_BASE_URL.replace(/\/$/, '') + path, origin).href;
}
