import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import { AppError } from '@/shared/application/app-error';
import type { AuthHttpSession } from './auth-http-session';
import { waitWithSignal } from './wait-with-signal';
import { HttpError } from './http-error';

export interface HttpClientOptions {
  baseURL: string;
  timeoutMs: number;
  onUnauthorized?: () => void;
  auth?: AuthHttpSession;
}
type SessionRequest = InternalAxiosRequestConfig & {
  __authSession?: { version: number; replayed: boolean };
};
export function createHttpClient({ baseURL, timeoutMs, onUnauthorized, auth }: HttpClientOptions) {
  const client = axios.create({
    baseURL,
    timeout: timeoutMs,
    headers: { Accept: 'application/json' },
    withCredentials: true,
    xsrfCookieName: 'XSRF-TOKEN',
    xsrfHeaderName: 'X-XSRF-TOKEN',
  });
  const assertCurrent = (config: SessionRequest) => {
    if (auth && config.__authSession?.version !== auth.getSessionVersion()) {
      throw new axios.CanceledError('Session changed.');
    }
  };
  if (auth) {
    client.interceptors.request.use((config: SessionRequest) => {
      // This instance is scoped to the configured BFF; do not forward bearer tokens elsewhere.
      if (
        config.baseURL !== baseURL ||
        !/^\/(?!\/)/.test(config.url ?? '') ||
        [...(config.url ?? '')].some((char) => char === '\\' || char.charCodeAt(0) <= 32)
      ) {
        throw new AppError('contract', 'Authenticated requests must use BFF-relative endpoints.');
      }
      config.__authSession ??= { version: auth.getSessionVersion(), replayed: false };
      assertCurrent(config);
      const token = auth.getAccessToken();
      if (!token) throw new AppError('unauthorized', 'Sign in is required.');
      config.headers.set('Authorization', 'Bearer ' + token);
      return config;
    });
  }
  client.interceptors.response.use(
    (response) => {
      if (auth) assertCurrent(response.config);
      return response;
    },
    async (error: unknown) => {
      if (axios.isCancel(error) || error instanceof AppError || error instanceof HttpError)
        throw error;
      if (!axios.isAxiosError(error)) throw new AppError('server', 'Unexpected transport error.');
      const status = error.response?.status;
      // Metadata is local to this adapter and survives Axios request replay.
      const config = error.config as SessionRequest | undefined;
      if (auth && config) assertCurrent(config);
      if (status === 401 && auth && config?.__authSession) {
        if (config.signal?.aborted) throw new axios.CanceledError('Request cancelled.');
        if (config.__authSession.replayed) {
          auth.invalidate();
          throw new HttpError('unauthorized', 401);
        }
        config.__authSession.replayed = true;
        const token = auth.getAccessToken();
        // A late 401 from the old token can reuse a refresh that already completed.
        if (!token || config.headers.get('Authorization') === 'Bearer ' + token) {
          await waitWithSignal(auth.refreshAccessToken(), config.signal);
        }
        assertCurrent(config);
        if (config.signal?.aborted) throw new axios.CanceledError('Request cancelled.');
        return client.request<unknown>(config);
      }
      if (status === 401) onUnauthorized?.();
      const kind =
        status === 401
          ? 'unauthorized'
          : status === 403
            ? 'forbidden'
            : status === 404
              ? 'not-found'
              : status === 409 || status === 412
                ? 'conflict'
                : status === 429
                  ? 'rate-limit'
                  : error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT'
                    ? 'timeout'
                    : status === undefined
                      ? 'network'
                      : 'server';
      throw new HttpError(kind, status);
    },
  );
  return client;
}
export type HttpClient = ReturnType<typeof createHttpClient>;
