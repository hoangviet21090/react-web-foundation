import type { InternalAxiosRequestConfig } from 'axios';
import { describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import { http, HttpResponse } from 'msw';
import { server } from './server';
import { createHttpClient } from '@/config/http/http-client';
import { waitWithSignal } from '@/config/http/wait-with-signal';
import { createAuthSession } from '@/usecases/auth-session';
import { createAuthService } from '@/services/auth-service';

import { createProjectService } from '@/services/project-service';
import { createProjectUseCases } from '@/usecases/project-usecases';
import { issueMockSession } from '@/mocks/auth-handlers';
import { mockUrl } from '@/mocks/api-url';
import { success, failure } from '@/mocks/response';

const options = { baseURL: 'http://localhost/api', timeoutMs: 2000 };
const login = { email: 'demo@example.test', password: 'Demo123!' };
const params = { page: 1, pageSize: 5, search: '' };
const unauthorized = () => HttpResponse.json(failure('Expired', 'UNAUTHORIZED'), { status: 401 });
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((yes) => {
    resolve = yes;
  });
  return { promise, resolve };
}
async function setup() {
  const clear = vi.fn();
  const service = createAuthService(createHttpClient(options));
  const session = createAuthSession(service, clear);
  await session.login(login);
  const client = createHttpClient({ ...options, auth: session });
  return { session, client, clear, service };
}
describe('Authenticated HTTP and MSW contract', () => {
  it('protects API with 401 without bearer and 403 for a viewer write', async () => {
    const plain = createHttpClient(options);
    await expect(plain.get('/projects')).rejects.toMatchObject({ status: 401 });
    const { client, session } = await setup();
    await session.login({ ...login, email: 'viewer@example.test' });
    await expect(client.post('/projects', { name: 'Demo Test', budget: 1 })).rejects.toMatchObject({
      status: 403,
    });
    expect(session.getSnapshot().status).toBe('authenticated');
  });
  it('login validates credentials, reload restores via refresh, logout clears the session', async () => {
    const service = createAuthService(createHttpClient(options));
    expect(await service.login(login)).toMatchObject({
      expiresInSeconds: 30,
    });
    const restored = createAuthSession(service, vi.fn());
    await restored.restore();
    expect(restored.getSnapshot().status).toBe('authenticated');
    await restored.logout();
    await restored.restore();
    expect(restored.getSnapshot().status).toBe('anonymous');
  });
  it('invalid credentials do not enter an automatic refresh loop', async () => {
    let refreshes = 0;
    server.use(
      http.post(mockUrl('/auth/refresh'), () => {
        refreshes++;
        return unauthorized();
      }),
    );
    await expect(
      createAuthService(createHttpClient(options)).login({ ...login, password: 'wrong' }),
    ).rejects.toMatchObject({ kind: 'unauthorized' });
    expect(refreshes).toBe(0);
  });
  it('deduplicates simultaneous 401s and replays each request once', async () => {
    const { client, session } = await setup();
    const old = session.getAccessToken();
    const release = deferred<void>();
    let refreshes = 0;
    let oldRequests = 0;
    let successful = 0;
    server.use(
      http.get(mockUrl('/protected'), ({ request }) => {
        if (request.headers.get('Authorization') === 'Bearer ' + old) {
          oldRequests++;
          return unauthorized();
        }
        successful++;
        return HttpResponse.json(success({ ok: true }));
      }),
      http.post(mockUrl('/auth/refresh'), async () => {
        refreshes++;
        await release.promise;
        return HttpResponse.json(success(issueMockSession()));
      }),
    );
    const requests = [client.get('/protected'), client.get('/protected'), client.get('/protected')];
    await vi.waitFor(() => expect(oldRequests).toBe(3));
    release.resolve();
    await Promise.all(requests);
    expect(refreshes).toBe(1);
    expect(successful).toBe(3);
  });
  it('reuses the new token for a late 401 instead of refreshing again', async () => {
    const { client, session } = await setup();
    const old = session.getAccessToken();
    const release = deferred<void>();
    let refreshes = 0;
    let lateStarted = false;
    server.use(
      http.get(mockUrl('/protected'), async ({ request }) => {
        if (request.headers.get('Authorization') !== 'Bearer ' + old)
          return HttpResponse.json(success({ ok: true }));
        if (new URL(request.url).searchParams.has('late')) {
          lateStarted = true;
          await release.promise;
        }
        return unauthorized();
      }),
      http.post(mockUrl('/auth/refresh'), () => {
        refreshes++;
        return HttpResponse.json(success(issueMockSession()));
      }),
    );
    const late = client.get('/protected?late=1');
    await vi.waitFor(() => expect(lateStarted).toBe(true));
    await client.get('/protected');
    release.resolve();
    await late;
    expect(refreshes).toBe(1);
  });
  it('stops after a replay receives 401 and clears cached identity', async () => {
    const { client, session, clear } = await setup();
    let reads = 0;
    let refreshes = 0;
    server.use(
      http.get(mockUrl('/protected'), () => {
        reads++;
        return unauthorized();
      }),
      http.post(mockUrl('/auth/refresh'), () => {
        refreshes++;
        return HttpResponse.json(success(issueMockSession()));
      }),
    );
    await expect(client.get('/protected')).rejects.toMatchObject({ kind: 'unauthorized' });
    expect(reads).toBe(2);
    expect(refreshes).toBe(1);
    expect(clear).toHaveBeenCalledTimes(2);
    expect(session.getSnapshot().status).toBe('anonymous');
  });
  it.each([401, 500])(
    'refresh HTTP %s never retries itself; all waiters leave without replay',
    async (status) => {
      const { client, session } = await setup();
      const release = deferred<void>();
      let refreshes = 0;
      let reads = 0;
      server.use(
        http.get(mockUrl('/protected'), () => {
          reads++;
          return unauthorized();
        }),
        http.post(mockUrl('/auth/refresh'), async () => {
          refreshes++;
          await release.promise;
          return HttpResponse.json(failure('failed', 'FAILED'), { status });
        }),
      );
      const result = Promise.allSettled([client.get('/protected'), client.get('/protected')]);
      await vi.waitFor(() => expect(reads).toBe(2));
      release.resolve();
      expect((await result).every((item) => item.status === 'rejected')).toBe(true);
      expect(refreshes).toBe(1);
      expect(reads).toBe(2);
      expect(session.getAccessToken()).toBeNull();
      expect(session.getSnapshot().status).toBe(status === 401 ? 'anonymous' : 'error');
    },
  );
  it('cancels one waiting caller without cancelling a shared refresh', async () => {
    const { client, session } = await setup();
    const old = session.getAccessToken();
    const release = deferred<void>();
    let reads = 0;
    let refreshed = false;
    let successes = 0;
    server.use(
      http.get(mockUrl('/protected'), ({ request }) => {
        if (request.headers.get('Authorization') === 'Bearer ' + old) {
          reads++;
          return unauthorized();
        }
        successes++;
        return HttpResponse.json(success({ ok: true }));
      }),
      http.post(mockUrl('/auth/refresh'), async () => {
        refreshed = true;
        await release.promise;
        return HttpResponse.json(success(issueMockSession()));
      }),
    );
    const controller = new AbortController();
    const cancelled = client.get('/protected', { signal: controller.signal });
    const rejection = expect(cancelled).rejects.toSatisfy(axios.isCancel);
    const surviving = client.get('/protected');
    await vi.waitFor(() => {
      expect(reads).toBe(2);
      expect(refreshed).toBe(true);
    });
    controller.abort();
    await rejection;
    release.resolve();
    await surviving;
    expect(successes).toBe(1);
    expect(session.getSnapshot().status).toBe('authenticated');
  });
  it('does not accept a late successful response after logout', async () => {
    const { client, session } = await setup();
    const release = deferred<void>();
    let started = false;
    server.use(
      http.get(mockUrl('/protected'), async () => {
        started = true;
        await release.promise;
        return HttpResponse.json(success({ private: true }));
      }),
    );
    const request = client.get('/protected');
    const rejection = expect(request).rejects.toSatisfy(axios.isCancel);
    await vi.waitFor(() => expect(started).toBe(true));
    await session.logout();
    release.resolve();
    await rejection;
  });
  it('rejects bearer forwarding to an arbitrary host or after logout', async () => {
    const { client, session } = await setup();
    for (const url of [
      'https://untrusted.test/path',
      '//untrusted.test',
      '/\\untrusted.test',
      'relative',
    ]) {
      await expect(client.get(url)).rejects.toMatchObject({ kind: 'contract' });
    }
    await expect(
      client.get('/projects', { baseURL: 'https://untrusted.test' }),
    ).rejects.toMatchObject({ kind: 'contract' });
    await session.logout();
    await expect(client.get('/projects')).rejects.toMatchObject({ kind: 'unauthorized' });
  });
  it.each([
    '/../outside',
    '/../../outside',
    '/%2e%2e/outside',
    '/projects/%2E%2E',
    '/projects/.',
    '/projects/..',
    '/%2e%2e%2foutside',
    '/%2e%2e%5coutside',
    '/projects/%',
  ])('rejects BFF path traversal before dispatch: %s', async (endpoint) => {
    const { client } = await setup();
    const adapter = vi.fn();
    client.defaults.adapter = adapter;
    await expect(client.get(endpoint)).rejects.toMatchObject({ kind: 'contract' });
    expect(adapter).not.toHaveBeenCalled();
  });
  it('permits encoded resource ids and query values within the configured BFF', async () => {
    const { client } = await setup();
    const adapter = vi.fn((config: InternalAxiosRequestConfig) =>
      Promise.resolve({
        data: success({ ok: true }),
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      }),
    );
    client.defaults.adapter = adapter;
    await client.get('/projects/' + encodeURIComponent('project/item'));
    await client.get('/projects', { params: { search: '../outside' } });
    expect(adapter).toHaveBeenCalledTimes(2);
  });
  it('a POST rejected before processing can replay once without creating two drafts', async () => {
    const { client } = await setup();
    server.use(http.post(mockUrl('/projects'), unauthorized, { once: true }));
    const useCases = createProjectUseCases(createProjectService(client));
    await useCases.create({ name: 'Replay Demo', budget: 250 });
    expect((await useCases.list(params)).totalCount).toBe(7);
  });
  it('rejects malformed token payloads and business envelopes', async () => {
    const { session } = await setup();
    server.use(
      http.post(mockUrl('/auth/refresh'), () =>
        HttpResponse.json(success({ accessToken: '', expiresInSeconds: 0 })),
      ),
    );
    await expect(session.refreshAccessToken()).rejects.toMatchObject({ kind: 'contract' });
    expect(session.getAccessToken()).toBeNull();
    server.use(
      http.post(mockUrl('/auth/login'), () => HttpResponse.json(failure('Denied', 'DENIED'))),
    );
    await expect(session.login(login)).rejects.toMatchObject({ kind: 'business' });
  });
  it('wait helper handles already cancelled and rejected promises without leaking listeners', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(waitWithSignal(Promise.resolve('ok'), controller.signal)).rejects.toSatisfy(
      axios.isCancel,
    );
    await expect(
      waitWithSignal(Promise.reject(new Error('failed')), new AbortController().signal),
    ).rejects.toThrow('failed');
  });
});
