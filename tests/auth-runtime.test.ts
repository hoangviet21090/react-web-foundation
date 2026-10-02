import { afterEach, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { createAppRuntime, getAppRuntime } from '@/config/runtime';
import { login, logout, restoreSession } from '@/store/auth/auth-thunks';
import { updatePreferences } from '@/store/preferences/preferences-thunks';
import { mockUrl } from '@/mocks/api-url';
import { failure } from '@/mocks/response';
import { server } from './server';

afterEach(() => {
  vi.unstubAllGlobals();
});
describe('Auth runtime and Redux state', () => {
  it('boots and updates preferences when the browser denies localStorage access', async () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }));
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new DOMException('Storage is disabled.', 'SecurityError');
    });
    const app = await createAppRuntime();
    expect(app.store.getState().preferences).toEqual({ language: 'vi', theme: 'light' });
    await app.store.dispatch(updatePreferences({ theme: 'dark' }));
    expect(app.store.getState().preferences.theme).toBe('dark');
  });
  it('clears Query caches, syncs public state and enforces auth before project requests', async () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }));
    const app = await createAppRuntime();
    expect(getAppRuntime()).toBe(app);
    await app.store.dispatch(restoreSession());
    expect(app.store.getState().auth.status).toBe('anonymous');
    await expect(app.projects.list({ page: 1, pageSize: 5, search: '' })).rejects.toMatchObject({
      kind: 'unauthorized',
    });
    await app.store.dispatch(login({ email: 'demo@example.test', password: 'Demo123!' }));
    expect(app.store.getState().auth).toMatchObject({
      status: 'authenticated',
      user: { id: 'mock-demo' },
    });
    expect(JSON.stringify(app.store.getState())).not.toContain(app.auth.getAccessToken());
    expect(JSON.stringify(app.store.getState())).not.toContain('Demo123!');
    const result = await app.queryClient.fetchQuery({
      queryKey: ['projects'],
      queryFn: () => app.projects.list({ page: 1, pageSize: 5, search: '' }),
    });
    expect(result.totalCount).toBe(6);
    expect(app.queryClient.getQueryCache().getAll()).toHaveLength(1);
    await app.store.dispatch(logout());
    expect(app.queryClient.getQueryCache().getAll()).toHaveLength(0);
    expect(app.queryClient.getMutationCache().getAll()).toHaveLength(0);
    expect(app.auth.getAccessToken()).toBeNull();
    expect(app.store.getState().auth.status).toBe('anonymous');
    await app.store.dispatch(login({ email: 'viewer@example.test', password: 'Demo123!' }));
    await expect(app.projects.create({ name: 'Denied Demo', budget: 10 })).rejects.toMatchObject({
      kind: 'forbidden',
    });
    await app.store.dispatch(logout());
  });
  it('keeps restore failure serializable and routes closed until an explicit retry', async () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }));
    server.use(
      http.post(mockUrl('/auth/refresh'), () =>
        HttpResponse.json(failure('Unavailable', 'UNAVAILABLE'), { status: 503 }),
      ),
    );
    const app = await createAppRuntime();
    await app.store.dispatch(restoreSession());
    const state = app.store.getState().auth;
    expect(state).toMatchObject({
      status: 'error',
      operation: 'restore',
      error: { kind: 'server', retryable: true },
    });
    if (state.status !== 'error') throw new Error('Expected restore failure.');
    expect(state.error).not.toBeInstanceOf(Error);
    expect(JSON.parse(JSON.stringify(state))).toEqual(state);
    expect(app.auth.getAccessToken()).toBeNull();
    server.resetHandlers();
    await app.store.dispatch(restoreSession());
    expect(app.store.getState().auth.status).toBe('anonymous');
  });
});
