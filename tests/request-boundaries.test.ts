import { describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import type { GenericAbortSignal } from 'axios';
import { http, HttpResponse, delay } from 'msw';
import { AppError, getErrorKind, OperationCancelledError } from '@/usecases/app-error';
import { DomainError } from '@/entities/domain-error';
import { withApplicationErrors } from '@/config/http/application-errors';
import { HttpError } from '@/config/http/http-error';
import { createHttpClient } from '@/config/http/http-client';
import { issueMockSession } from '@/mocks/auth-handlers';
import { createQueryClient } from '@/config/query-client';
import { createProjectService } from '@/services/project-service';
import { createProjectUseCases } from '@/usecases/project-usecases';
import { createAuthService } from '@/services/auth-service';
import { createAuthSession } from '@/usecases/auth-session';
import { validateCreateProject } from '@/entities/project';
import { validateLogin } from '@/entities/auth';
import { server } from './server';
import { success } from '@/mocks/response';
import { mockApiUrl } from '@/mocks/handlers';
import { mockUrl } from '@/mocks/api-url';

const params = { page: 1, pageSize: 5, search: '' };
function projects() {
  const http = createHttpClient({ baseURL: 'http://localhost/api', timeoutMs: 2000 });
  http.defaults.headers.common.Authorization = 'Bearer ' + issueMockSession().accessToken;
  return createProjectUseCases(createProjectService(http));
}

describe('Web request cancellation', () => {
  it('does not send an already cancelled request', async () => {
    const requested = vi.fn();
    server.use(
      http.get(mockApiUrl, () => {
        requested();
        return HttpResponse.json(success({ items: [], totalCount: 0, page: 1, pageSize: 5 }));
      }),
    );
    const controller = new AbortController();
    controller.abort();
    await expect(projects().list(params, controller.signal)).rejects.toBeInstanceOf(
      OperationCancelledError,
    );
    expect(requested).not.toHaveBeenCalled();
  });

  it('cancels the HTTP request when Query cancels an in-flight read', async () => {
    let requestStarted = false;
    server.use(
      http.get(mockApiUrl, async () => {
        requestStarted = true;
        await delay(100);
        return HttpResponse.json(success({ items: [], totalCount: 0, page: 1, pageSize: 5 }));
      }),
    );
    const client = createHttpClient({ baseURL: 'http://localhost/api', timeoutMs: 2000 });
    let transportSignal: GenericAbortSignal | undefined;
    const get = client.get.bind(client);
    vi.spyOn(client, 'get').mockImplementation((url, config) => {
      transportSignal = config?.signal;
      return get(url, config);
    });
    const useCases = createProjectUseCases(createProjectService(client));
    const queryClient = createQueryClient();
    const pending = queryClient.fetchQuery({
      queryKey: ['cancel-request'],
      queryFn: ({ signal }) => useCases.list(params, signal),
    });
    const rejection = expect(pending).rejects.toBeInstanceOf(Error);
    await vi.waitFor(() => expect(requestStarted).toBe(true));
    await queryClient.cancelQueries({ queryKey: ['cancel-request'] });
    await rejection;
    expect(transportSignal?.aborted).toBe(true);
    expect(queryClient.getQueryData(['cancel-request'])).toBeUndefined();
    queryClient.clear();
  });

  it('allows reads without an optional cancellation signal', async () => {
    expect((await projects().list(params)).items).toHaveLength(5);
  });
});

describe('Request errors and business rules', () => {
  it.each([
    [400, 'validation', false],
    [422, 'validation', false],
    [401, 'unauthorized', false],
    [403, 'forbidden', false],
    [404, 'not-found', false],
    [503, 'server', true],
  ] as const)(
    'classifies HTTP %s without exposing request details',
    async (status, kind, retryable) => {
      server.use(http.get(mockApiUrl, () => HttpResponse.json({ secret: 'private' }, { status })));
      const error: unknown = await projects()
        .list(params)
        .catch((cause: unknown) => cause);
      expect(error).toBeInstanceOf(AppError);
      expect(error).toMatchObject({ kind, retryable });
      for (const key of ['status', 'response', 'request', 'config', 'cause'])
        expect(error).not.toHaveProperty(key);
      expect(JSON.stringify(error)).not.toContain('private');
    },
  );

  it('classifies a network failure as retryable', async () => {
    server.use(http.get(mockApiUrl, () => HttpResponse.error()));
    await expect(projects().list(params)).rejects.toMatchObject({
      kind: 'network',
      retryable: true,
    });
  });

  it('keeps an auth restore failure free of HTTP metadata', async () => {
    server.use(http.post(mockUrl('/auth/refresh'), () => HttpResponse.json({}, { status: 503 })));
    const auth = createAuthSession(
      createAuthService(
        createHttpClient({
          baseURL: 'http://localhost/api',
          timeoutMs: 2000,
        }),
      ),
      vi.fn(),
    );
    await auth.restore();
    const state = auth.getSnapshot();
    expect(state.status).toBe('error');
    if (state.status !== 'error') throw new Error('Expected failure');
    expect(state.error).toBeInstanceOf(AppError);
    expect(state.error).not.toBeInstanceOf(HttpError);
    expect(state.error).not.toHaveProperty('status');
  });

  it('preserves known failures and sanitizes unknown transport details', async () => {
    const known = [
      new AppError('contract', 'Invalid'),
      new DomainError('INVALID', 'Invalid'),
      new OperationCancelledError(),
    ];
    for (const error of known)
      await expect(withApplicationErrors(() => Promise.reject(error))).rejects.toBe(error);
    await expect(
      withApplicationErrors(() => Promise.reject(new Error('private backend detail'))),
    ).rejects.toMatchObject({
      message: 'The request could not be completed.',
      kind: 'server',
      retryable: false,
    });
    await expect(
      withApplicationErrors(() => Promise.reject(new axios.CanceledError('private'))),
    ).rejects.toBeInstanceOf(OperationCancelledError);
  });

  it('validates business input independently of transport', () => {
    expect(() => validateLogin({ email: '', password: '' })).toThrow(DomainError);
    expect(() => validateCreateProject({ name: 'Demo', budget: -1 })).toThrow(DomainError);
    expect(getErrorKind(new DomainError('INVALID', 'Invalid'))).toBe('validation');
    expect(getErrorKind(new DomainError('RULE', 'Rule', 'business'))).toBe('business');
    expect(getErrorKind(new AppError('unauthorized', 'Expired'))).toBe('unauthorized');
    expect(getErrorKind(new Error())).toBe('unknown');
  });
});
