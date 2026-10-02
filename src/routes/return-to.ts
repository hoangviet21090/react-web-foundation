import { matchPath } from 'react-router';
import { APP_ROUTES } from '@/constants/routes';

const RETURN_URL_ORIGIN = 'https://app.invalid';
function isLocalPath(path: string): boolean {
  return (
    path.startsWith('/') &&
    !path.startsWith('//') &&
    ![...path].some(
      (char) => char === '\\' || char.charCodeAt(0) <= 32 || char.charCodeAt(0) === 127,
    )
  );
}
export function safeReturnTo(state: unknown): string {
  const fallback = APP_ROUTES.projects.path;
  if (
    !state ||
    typeof state !== 'object' ||
    !('returnTo' in state) ||
    typeof state.returnTo !== 'string' ||
    !isLocalPath(state.returnTo)
  )
    return fallback;
  try {
    const url = new URL(state.returnTo, RETURN_URL_ORIGIN);
    const pathname = decodeURIComponent(url.pathname);
    // Match Router's case-insensitive/trailing-slash behavior, including encoded paths.
    if (
      url.origin !== RETURN_URL_ORIGIN ||
      !isLocalPath(pathname) ||
      matchPath(APP_ROUTES.login.path, pathname)
    )
      return fallback;
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}
