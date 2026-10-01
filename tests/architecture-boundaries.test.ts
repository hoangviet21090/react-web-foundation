import { describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import type { GenericAbortSignal } from 'axios';
import { http, HttpResponse, delay } from 'msw';
import { AppError, getErrorKind } from '@/shared/application/app-error';
import { DomainError } from '@/shared/domain/domain-error';
import { OperationCancelledError } from '@/shared/application/cancellation';
import type { Cancellation } from '@/shared/application/cancellation';
import { fromAbortSignal, withAbortSignal } from '@/shared/infrastructure/cancellation';
import { withApplicationErrors } from '@/shared/infrastructure/http/application-errors';
import { HttpError } from '@/shared/infrastructure/http/http-error';
import { createHttpClient } from '@/shared/infrastructure/http/http-client';
import { createQueryClient } from '@/shared/infrastructure/query-client';
import { createHttpProjectService } from '@/features/projects/infrastructure/services/http-project-service';
import { createHttpProjectRepository } from '@/features/projects/infrastructure/repositories/http-project-repository';
import { createProjectUseCases } from '@/features/projects/application/project-use-cases';
import { createHttpAuthService } from '@/features/auth/infrastructure/services/http-auth-service';
import { createHttpAuthRepository } from '@/features/auth/infrastructure/repositories/http-auth-repository';
import { createAuthSession } from '@/features/auth/application/auth-session';
import { validateCreateProject } from '@/features/projects/domain/project';
import { validateLogin } from '@/features/auth/domain/auth';
import { server } from './server';
import { success, mockApiUrl } from '@/mocks/handlers';
import { mockUrl } from '@/mocks/api-url';

const params = { page: 1, pageSize: 5, search: '' };
function fakeCancellation() {
  let cancelled = false;
  const listeners = new Set<() => void>();
  const unsubscribe = vi.fn((listener: () => void) => {
    listeners.delete(listener);
  });
  const cancellation: Cancellation = {
    get isCancellationRequested() {
      return cancelled;
    },
    subscribe(listener) {
      if (cancelled) listener();
      else listeners.add(listener);
      return () => {
        unsubscribe(listener);
      };
    },
  };
  return {
    cancellation,
    unsubscribe,
    listeners,
    cancel: () => {
      cancelled = true;
      for (const listener of [...listeners]) listener();
      listeners.clear();
    },
  };
}
function projects() {
  return createProjectUseCases(
    createHttpProjectRepository(
      createHttpProjectService(
        createHttpClient({ baseURL: 'http://localhost/api', timeoutMs: 2000 }),
      ),
    ),
  );
}

describe('Cancellation across the application boundary', () => {
  it('adapts browser cancellation lazily and unsubscribes independently', () => {
    const controller = new AbortController();
    const add = vi.spyOn(controller.signal, 'addEventListener');
    const remove = vi.spyOn(controller.signal, 'removeEventListener');
    const port = fromAbortSignal(controller.signal);
    expect(add).not.toHaveBeenCalled();
    const first = vi.fn();
    const second = vi.fn();
    const stop = port.subscribe(first);
    const stopSecond = port.subscribe(second);
    stop();
    controller.abort();
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
    expect(port.isCancellationRequested).toBe(true);
    stopSecond();
    expect(remove).toHaveBeenCalledTimes(2);
    const alreadyCancelled = vi.fn();
    port.subscribe(alreadyCancelled)();
    expect(alreadyCancelled).toHaveBeenCalledTimes(1);
  });
  it.each(['success', 'failure', 'cancel'] as const)(
    'releases the transport subscription on %s',
    async (mode) => {
      const source = fakeCancellation();
      const request = withAbortSignal(source.cancellation, async (signal) => {
        expect(signal?.aborted).toBe(false);
        if (mode === 'cancel') {
          source.cancel();
          expect(signal?.aborted).toBe(true);
        }
        if (mode === 'failure') throw new Error('failed');
        return Promise.resolve('done');
      });
      if (mode === 'failure') await expect(request).rejects.toThrow('failed');
      else expect(await request).toBe('done');
      expect(source.unsubscribe).toHaveBeenCalledTimes(1);
      expect(source.listeners.size).toBe(0);
    },
  );
  it('short-circuits HTTP before sending when the inner port is already cancelled', async () => {
    let requests = 0;
    server.use(
      http.get(mockApiUrl, () => {
        requests++;
        return HttpResponse.json(success({}));
      }),
    );
    const source = fakeCancellation();
    source.cancel();
    await expect(projects().list(params, source.cancellation)).rejects.toBeInstanceOf(
      OperationCancelledError,
    );
    expect(requests).toBe(0);
    expect(source.unsubscribe).toHaveBeenCalledTimes(1);
  });
  it('cancels actual HTTP through a fake core port and does not return Axios errors', async () => {
    let started = false;
    server.use(
      http.get(mockApiUrl, async () => {
        started = true;
        await delay(120);
        return HttpResponse.json(success({ items: [], totalCount: 0, page: 1, pageSize: 5 }));
      }),
    );
    const source = fakeCancellation();
    const request = projects().list(params, source.cancellation);
    const rejection = expect(request).rejects.toBeInstanceOf(OperationCancelledError);
    await vi.waitFor(() => expect(started).toBe(true));
    source.cancel();
    await rejection;
    expect(source.unsubscribe).toHaveBeenCalledTimes(1);
  });
  it('Query cancellation reaches the HTTP signal and never caches the late response', async () => {
    let transportSignal: GenericAbortSignal | undefined;
    let requestStarted = false;
    const client = createHttpClient({ baseURL: 'http://localhost/api', timeoutMs: 2000 });
    client.interceptors.request.use((config) => {
      transportSignal = config.signal;
      return config;
    });
    const useCases = createProjectUseCases(
      createHttpProjectRepository(createHttpProjectService(client)),
    );
    server.use(
      http.get(mockApiUrl, async () => {
        requestStarted = true;
        await delay(120);
        return HttpResponse.json(success({ items: [], totalCount: 0, page: 1, pageSize: 5 }));
      }),
    );
    const queryClient = createQueryClient();
    const pending = queryClient.fetchQuery({
      queryKey: ['cancel-boundary'],
      queryFn: ({ signal }) => useCases.list(params, fromAbortSignal(signal)),
    });
    const rejection = expect(pending).rejects.toBeInstanceOf(Error);
    await vi.waitFor(() => expect(requestStarted).toBe(true));
    await queryClient.cancelQueries({ queryKey: ['cancel-boundary'] });
    await rejection;
    expect(transportSignal?.aborted).toBe(true);
    expect(queryClient.getQueryData(['cancel-boundary'])).toBeUndefined();
    queryClient.clear();
  });
  it('supports calls without cancellation', async () => {
    const operation = vi.fn().mockResolvedValue('done');
    expect(await withAbortSignal(undefined, operation)).toBe('done');
    expect(operation).toHaveBeenCalledWith();
  });
});

describe('Error ownership', () => {
  it.each([
    [400, 'server', false],
    [401, 'unauthorized', false],
    [403, 'forbidden', false],
    [404, 'not-found', false],
    [503, 'server', true],
  ] as const)(
    'keeps HTTP %s in infrastructure, exposes only classified application failure',
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
  it('classifies network failures as retryable without HTTP metadata', async () => {
    server.use(http.get(mockApiUrl, () => HttpResponse.error()));
    await expect(projects().list(params)).rejects.toMatchObject({
      kind: 'network',
      retryable: true,
    });
  });
  it('stores an application failure, not an HTTP error, when auth restore fails', async () => {
    server.use(http.post(mockUrl('/auth/refresh'), () => HttpResponse.json({}, { status: 503 })));
    const auth = createAuthSession(
      createHttpAuthRepository(
        createHttpAuthService(
          createHttpClient({ baseURL: 'http://localhost/api', timeoutMs: 2000 }),
        ),
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
  it('preserves known errors and strips unclassified details at the repository boundary', async () => {
    const known = [
      new AppError('contract', 'Invalid'),
      new DomainError('INVALID', 'Invalid'),
      new OperationCancelledError(),
    ];
    for (const error of known) {
      await expect(withApplicationErrors(() => Promise.reject(error))).rejects.toBe(error);
    }
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
  it('business validation produces domain codes without transport metadata', () => {
    expect(() => validateLogin({ email: '', password: '' })).toThrow(DomainError);
    expect(() => validateCreateProject({ name: 'Demo', budget: -1 })).toThrow(DomainError);
    expect(getErrorKind(new DomainError('INVALID', 'Invalid'))).toBe('validation');
    expect(getErrorKind(new DomainError('RULE', 'Rule', 'business'))).toBe('business');
    expect(getErrorKind(new AppError('unauthorized', 'Expired'))).toBe('unauthorized');
    expect(getErrorKind(new Error())).toBe('unknown');
  });
});
