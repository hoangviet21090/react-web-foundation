import { http, HttpResponse, delay } from 'msw';
import { z } from 'zod';
import type { AuthUser, Permission } from '@/features/auth/domain/auth';
import type { AuthCredentials } from '@/features/auth/application/auth-credentials';
import { success, failure } from './response';
import { mockUrl } from './api-url';

export const MOCK_ACCESS_TTL_SECONDS = 30;
const MOCK_SESSION_COOKIE = 'foundation_mock_session';
const tokens = new Map<string, { user: AuthUser; expiresAt: number }>();
type DemoAccount = 'demo' | 'viewer';
const getUser = (account: DemoAccount): AuthUser => ({
  id: 'mock-' + account,
  name: account === 'demo' ? 'Demo User' : 'Demo Viewer',
  email: account + '@example.test',
  permissions:
    account === 'demo'
      ? ['projects:read', 'projects:create', 'projects:update', 'projects:delete']
      : ['projects:read'],
});
// A readable NON-SECRET demo marker, never a refresh token.
// Only a real HTTP backend can set/rotate an HttpOnly refresh cookie.
function setDemoCookie(account: DemoAccount) {
  document.cookie =
    MOCK_SESSION_COOKIE +
    '=' +
    account +
    '.' +
    String(Date.now() + 15 * 60_000) +
    '; Path=/; SameSite=Strict; Max-Age=900';
}
function readDemoCookie(): DemoAccount | null {
  const value = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(MOCK_SESSION_COOKIE + '='))
    ?.split('=')[1];
  const [account, expires] = value?.split('.') ?? [];
  return (account === 'demo' || account === 'viewer') && Number(expires) > Date.now()
    ? account
    : null;
}
export function issueMockSession(account: DemoAccount = 'demo'): AuthCredentials {
  const accessToken = 'mock-access-' + crypto.randomUUID();
  const user = getUser(account);
  tokens.set(accessToken, { user, expiresAt: Date.now() + MOCK_ACCESS_TTL_SECONDS * 1000 });
  setDemoCookie(account);
  return { accessToken, expiresInSeconds: MOCK_ACCESS_TTL_SECONDS, user };
}
export function resetMockAuth() {
  tokens.clear();
  document.cookie = MOCK_SESSION_COOKIE + '=; Path=/; Max-Age=0; SameSite=Strict';
}
export function authorizeMock(request: Request, permission: Permission) {
  const bearer = request.headers.get('Authorization')?.replace(/^Bearer /, '');
  const token = bearer ? tokens.get(bearer) : undefined;
  if (!token || token.expiresAt <= Date.now() || !readDemoCookie()) {
    return HttpResponse.json(failure('Authentication required.', 'UNAUTHORIZED'), { status: 401 });
  }
  if (!token.user.permissions.includes(permission)) {
    return HttpResponse.json(failure('Permission denied.', 'FORBIDDEN'), { status: 403 });
  }
  return null;
}
const credentialsSchema = z.object({ email: z.email(), password: z.string() });
export const authHandlers = [
  http.post(mockUrl('/auth/login'), async ({ request }) => {
    await delay(import.meta.env.MODE === 'test' ? 0 : 150);
    const input = credentialsSchema.safeParse(await request.json());
    const account =
      input.success && input.data.email === 'demo@example.test'
        ? 'demo'
        : input.success && input.data.email === 'viewer@example.test'
          ? 'viewer'
          : null;
    if (!account || !input.success || input.data.password !== 'Demo123!') {
      return HttpResponse.json(failure('Invalid credentials.', 'INVALID_CREDENTIALS'), {
        status: 401,
      });
    }
    return HttpResponse.json(success(issueMockSession(account)));
  }),
  http.post(mockUrl('/auth/refresh'), async () => {
    await delay(import.meta.env.MODE === 'test' ? 0 : 100);
    const account = readDemoCookie();
    return account
      ? HttpResponse.json(success(issueMockSession(account)))
      : HttpResponse.json(failure('Session expired.', 'UNAUTHORIZED'), { status: 401 });
  }),
  http.post(mockUrl('/auth/logout'), () => {
    resetMockAuth();
    return HttpResponse.json(success({ loggedOut: true }));
  }),
];
