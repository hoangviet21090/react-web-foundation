import { describe, expect, it, vi } from 'vitest';
import { http, HttpResponse, delay } from 'msw';
import axios from 'axios';
import { z } from 'zod';
import { issueMockSession } from '@/mocks/auth-handlers';
import { server } from './server';
import { createHttpClient } from '@/shared/infrastructure/http/http-client';
import { parseResponse, requireResult } from '@/shared/infrastructure/http/response';
import { createHttpProjectService } from '@/features/projects/infrastructure/services/http-project-service';
import { createHttpProjectRepository } from '@/features/projects/infrastructure/repositories/http-project-repository';
import { success, failure, mockApiUrl } from '@/mocks/handlers';
const makeClient = () => {
  const client = createHttpClient({ baseURL: 'http://localhost/api', timeoutMs: 1000 });
  client.defaults.headers.common.Authorization = 'Bearer ' + issueMockSession().accessToken;
  return client;
};
const params = { page: 1, pageSize: 5, search: '' };

describe('HTTP project adapter', () => {
  it('retains the full standard response at the service boundary', async () => {
    const response = await createHttpProjectService(makeClient()).list(params);
    expect(response).toMatchObject({
      success: true,
      errorCode: null,
      result: { totalCount: 6, page: 1, pageSize: 5 },
    });
    expect(response.result?.items).toHaveLength(5);
  });
  it('maps validated results into the domain and applies pagination/search', async () => {
    const repository = createHttpProjectRepository(createHttpProjectService(makeClient()));
    const second = await repository.list({ ...params, page: 2 });
    expect(second.items).toHaveLength(1);
    const found = await repository.list({ ...params, search: 'PRJ-DEMO-001' });
    expect(found.items[0]?.reference).toBe('PRJ-DEMO-001');
  });
  it('creates a draft through the same HTTP stack and lists it', async () => {
    const repository = createHttpProjectRepository(createHttpProjectService(makeClient()));
    const created = await repository.create({ name: 'New Demo', budget: 500 });
    expect(created).toMatchObject({ name: 'New Demo', budget: 500, status: 'draft' });
    expect((await repository.list(params)).totalCount).toBe(7);
  });
  it('returns a business failure envelope unchanged before repository handling', async () => {
    server.use(
      http.get(mockApiUrl, () =>
        HttpResponse.json(failure('Rejected by test', 'PROJECT_REJECTED')),
      ),
    );
    const service = createHttpProjectService(makeClient());
    expect(await service.list(params)).toMatchObject({
      success: false,
      errorCode: 'PROJECT_REJECTED',
      result: null,
    });
    await expect(createHttpProjectRepository(service).list(params)).rejects.toMatchObject({
      kind: 'business',
      code: 'PROJECT_REJECTED',
    });
  });
  it.each([401, 403, 404, 500])('maps HTTP %s without leaking the server body', async (status) => {
    const onUnauthorized = vi.fn();
    server.use(
      http.get(mockApiUrl, () =>
        HttpResponse.json({ secret: 'sensitive backend detail' }, { status }),
      ),
    );
    const client = createHttpClient({
      baseURL: 'http://localhost/api',
      timeoutMs: 1000,
      onUnauthorized,
    });
    await expect(client.get('/projects')).rejects.toMatchObject({ status });
    await expect(client.get('/projects')).rejects.not.toHaveProperty('response');
    expect(onUnauthorized).toHaveBeenCalledTimes(status === 401 ? 2 : 0);
  });
  it('maps a connection failure', async () => {
    server.use(http.get(mockApiUrl, () => HttpResponse.error()));
    await expect(makeClient().get('/projects')).rejects.toMatchObject({ kind: 'network' });
  });
  it('preserves Axios cancellation so Query can cancel an obsolete request', async () => {
    server.use(
      http.get(mockApiUrl, async () => {
        await delay(100);
        return HttpResponse.json(success({}));
      }),
    );
    const controller = new AbortController();
    const request = makeClient().get('/projects', { signal: controller.signal });
    controller.abort();
    await expect(request).rejects.toSatisfy(axios.isCancel);
  });
  it('rejects successful HTTP responses with invalid payloads', async () => {
    server.use(
      http.get(mockApiUrl, () => HttpResponse.json(success({ items: [], totalCount: 'six' }))),
    );
    await expect(createHttpProjectService(makeClient()).list(params)).rejects.toMatchObject({
      kind: 'contract',
    });
  });
});
describe('FE-owned response contract', () => {
  it.each([[], { items: [] }, { succeeded: true, result: [] }, { success: true }, null])(
    'rejects raw or legacy envelopes',
    (wire) => {
      expect(() => parseResponse(wire, z.array(z.string()))).toThrow();
    },
  );
  it('rejects null success payloads and populated failure payloads', () => {
    expect(() => parseResponse(success(null), z.string())).toThrow();
    expect(() =>
      parseResponse({ ...failure('failed', 'FAIL'), result: [] }, z.array(z.string())),
    ).toThrow();
    expect(() => requireResult({ ...success('ok'), result: null })).toThrow();
  });
  it('handles a failure without a message or code', () => {
    expect(() =>
      requireResult({ ...failure('failed', 'FAIL'), message: null, errorCode: null }),
    ).toThrow('The request was rejected.');
  });
});
