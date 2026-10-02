import { describe, expect, it, vi } from 'vitest';
import { createAuthSession } from '@/usecases/auth-session';
import type { AuthService, AuthCredentials } from '@/usecases/auth-session';

import { hasPermission, validateLogin } from '@/entities/auth';
import { AppError } from '@/usecases/app-error';
import { safeReturnTo } from '@/routes/return-to';

const credentials: AuthCredentials = {
  accessToken: 'unit-test-token',
  expiresInSeconds: 60,
  user: { id: 'one', name: 'Test', email: 'demo@example.test', permissions: ['projects:read'] },
};
const login = { email: 'demo@example.test', password: 'Demo123!' };
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
function setup(overrides: Partial<AuthService> = {}) {
  const repository = {
    login: vi.fn().mockResolvedValue(credentials),
    refresh: vi.fn().mockResolvedValue(credentials),
    logout: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
  const clear = vi.fn();
  const auth = createAuthSession(repository, clear);
  return { auth, repository, clear };
}
describe('Auth session lifecycle', () => {
  it('normalizes email without altering passwords and validates credentials', () => {
    expect(validateLogin({ email: ' Demo@EXAMPLE.test ', password: ' with spaces ' })).toEqual({
      email: 'demo@example.test',
      password: ' with spaces ',
    });
    expect(() => validateLogin({ email: 'invalid', password: 'a' })).toThrow();
    expect(() => validateLogin({ ...login, password: '' })).toThrow();
    expect(() => validateLogin({ ...login, password: 'a'.repeat(129) })).toThrow();
    expect(hasPermission(null, 'projects:read')).toBe(false);
    expect(hasPermission(credentials.user, 'projects:create')).toBe(false);
    expect(hasPermission(credentials.user, 'projects:read')).toBe(true);
  });
  it('starts closed, restores a session and keeps credentials out of the public snapshot', async () => {
    const { auth } = setup();
    expect(auth.getSnapshot().status).toBe('checking');
    const listener = vi.fn();
    const unsubscribe = auth.subscribe(listener);
    await auth.restore();
    expect(auth.getSnapshot()).toEqual({ status: 'authenticated', user: credentials.user });
    expect(auth.getSnapshot()).not.toHaveProperty('accessToken');
    expect(auth.getAccessToken()).toBe(credentials.accessToken);
    expect(listener).toHaveBeenCalled();
    unsubscribe();
    listener.mockClear();
    auth.invalidate();
    auth.invalidate();
    expect(listener).not.toHaveBeenCalled();
  });
  it('deduplicates refresh and simultaneous restore calls', async () => {
    const refresh = deferred<AuthCredentials>();
    const { auth, repository } = setup({ refresh: vi.fn(() => refresh.promise) });
    const first = auth.restore();
    const second = auth.restore();
    refresh.resolve(credentials);
    await Promise.all([first, second]);
    expect(repository.refresh).toHaveBeenCalledTimes(1);
    await auth.restore();
    expect(repository.refresh).toHaveBeenCalledTimes(1);
  });
  it('clears identity and cache on expired refresh, allows login again', async () => {
    const { auth, clear } = setup({
      refresh: vi.fn().mockRejectedValue(new AppError('unauthorized', 'Expired')),
    });
    await auth.restore();
    expect(auth.getSnapshot().status).toBe('anonymous');
    expect(auth.getAccessToken()).toBeNull();
    expect(clear).toHaveBeenCalledTimes(1);
    await auth.login(login);
    expect(auth.getSnapshot().status).toBe('authenticated');
  });
  it('keeps routes closed on refresh network failure and permits explicit retry', async () => {
    const refresh = vi
      .fn()
      .mockRejectedValueOnce(new AppError('network', 'Offline'))
      .mockResolvedValue(credentials);
    const { auth } = setup({ refresh });
    await auth.restore();
    expect(auth.getSnapshot()).toMatchObject({ status: 'error', operation: 'restore' });
    await auth.restore();
    expect(auth.getSnapshot().status).toBe('authenticated');
  });
  it('rejects an identity change during refresh', async () => {
    const { auth, clear } = setup({
      refresh: vi
        .fn()
        .mockResolvedValue({ ...credentials, user: { ...credentials.user, id: 'other-user' } }),
    });
    await auth.login(login);
    await expect(auth.refreshAccessToken()).rejects.toMatchObject({ kind: 'contract' });
    expect(auth.getSnapshot().status).toBe('error');
    expect(clear).toHaveBeenCalledTimes(2);
    expect(auth.getAccessToken()).toBeNull();
  });
  it('does not restore from a late refresh after logout, revokes cookie after refresh settles', async () => {
    const refresh = deferred<AuthCredentials>();
    const { auth, repository, clear } = setup({ refresh: () => refresh.promise });
    await auth.login(login);
    const pendingRefresh = auth.refreshAccessToken();
    const rejection = expect(pendingRefresh).rejects.toMatchObject({ kind: 'unauthorized' });
    const pendingLogout = auth.logout();
    expect(auth.logout()).toBe(pendingLogout);
    expect(auth.getAccessToken()).toBeNull();
    expect(auth.getSnapshot().status).toBe('signing-out');
    expect(repository.logout).not.toHaveBeenCalled();
    await expect(auth.refreshAccessToken()).rejects.toMatchObject({ kind: 'unauthorized' });
    await expect(auth.login(login)).rejects.toMatchObject({ kind: 'validation' });
    await auth.restore();
    refresh.resolve(credentials);
    await rejection;
    await pendingLogout;
    expect(repository.logout).toHaveBeenCalledTimes(1);
    expect(auth.getSnapshot().status).toBe('anonymous');
    expect(clear).toHaveBeenCalledTimes(2);
  });
  it('rejects duplicate login and ignores a late login after logout', async () => {
    const pending = deferred<AuthCredentials>();
    const { auth, repository } = setup({ login: () => pending.promise });
    const first = auth.login(login);
    await Promise.resolve();
    await expect(auth.login(login)).rejects.toMatchObject({ kind: 'validation' });
    await auth.restore();
    expect(repository.refresh).not.toHaveBeenCalled();
    const rejection = expect(first).rejects.toMatchObject({ kind: 'unauthorized' });
    const logout = auth.logout();
    pending.resolve(credentials);
    await rejection;
    await logout;
    expect(auth.getSnapshot().status).toBe('anonymous');
  });
  it('waits for refresh before starting login and does not accept the old response', async () => {
    const refresh = deferred<AuthCredentials>();
    const { auth, repository } = setup({ refresh: () => refresh.promise });
    const restore = auth.restore();
    const signIn = auth.login(login);
    expect(repository.login).not.toHaveBeenCalled();
    refresh.resolve(credentials);
    await Promise.all([restore, signIn]);
    expect(repository.login).toHaveBeenCalledTimes(1);
    expect(auth.getSnapshot().status).toBe('authenticated');
  });
  it('handles rejected login without retaining credentials', async () => {
    const { auth } = setup({
      login: vi.fn().mockRejectedValue(new AppError('unauthorized', 'Invalid credentials')),
    });
    await expect(auth.login(login)).rejects.toMatchObject({ kind: 'unauthorized' });
    expect(auth.getSnapshot().status).toBe('anonymous');
    expect(auth.getAccessToken()).toBeNull();
  });
  it('requires a successful server revocation before confirming logout and supports retry', async () => {
    const logout = vi.fn().mockRejectedValueOnce(new Error('Offline')).mockResolvedValue(undefined);
    const { auth } = setup({ logout });
    await auth.login(login);
    await auth.logout();
    expect(auth.getSnapshot()).toMatchObject({ status: 'error', operation: 'logout' });
    expect(auth.getAccessToken()).toBeNull();
    await auth.logout();
    expect(auth.getSnapshot().status).toBe('anonymous');
  });
  it('treats an already expired server session as logged out', async () => {
    const { auth } = setup({
      logout: vi.fn().mockRejectedValue(new AppError('unauthorized', 'Expired')),
    });
    await auth.logout();
    expect(auth.getSnapshot().status).toBe('anonymous');
  });
  it('normalizes an unexpected refresh failure without leaking details', async () => {
    const { auth } = setup({ refresh: vi.fn().mockRejectedValue(new Error('sensitive detail')) });
    await auth.restore();
    expect(auth.getSnapshot()).toMatchObject({
      status: 'error',
      error: { message: 'Session restore failed.' },
    });
  });
});
describe('Safe return URL', () => {
  it.each([
    null,
    {},
    { returnTo: 5 },
    { returnTo: 'https://evil.test' },
    { returnTo: '//evil.test' },
    { returnTo: '/\\evil.test' },
    { returnTo: '/login' },
    { returnTo: '/project\n' },
  ])('rejects unsafe return state', (state) => {
    expect(safeReturnTo(state)).toBe('/projects');
  });
  it('retains local path/search/hash', () => {
    expect(safeReturnTo({ returnTo: '/projects/new?from=list#form' })).toBe(
      '/projects/new?from=list#form',
    );
  });
});
