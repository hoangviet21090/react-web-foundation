import { AppError } from '@/shared/application/app-error';
import type { AuthRepository } from './ports/auth-repository';
import type { LoginCredentials } from '@/features/auth/domain/auth';
import type { AuthCredentials } from './auth-credentials';
import type { AuthState } from './auth-state';
import { validateLogin } from '@/features/auth/domain/auth';

export interface AuthSession {
  getSnapshot(this: void): AuthState;
  subscribe(this: void, listener: () => void): () => void;
  getAccessToken(): string | null;
  getSessionVersion(): number;
  restore(): Promise<void>;
  login(credentials: LoginCredentials): Promise<void>;
  logout(): Promise<void>;
  refreshAccessToken(): Promise<string>;
  invalidate(): void;
}
export function createAuthSession(
  repository: AuthRepository,
  onSessionCleared: () => void,
): AuthSession {
  let state: AuthState = { status: 'checking', user: null };
  let accessToken: string | null = null;
  let version = 0;
  let refreshFlight: Promise<string> | null = null;
  let loginFlight: Promise<void> | null = null;
  let logoutFlight: Promise<void> | null = null;
  const listeners = new Set<() => void>();
  const publish = (next: AuthState) => {
    state = next;
    for (const listener of listeners) listener();
  };
  const clear = () => {
    version++;
    accessToken = null;
    onSessionCleared();
  };
  const assertCurrent = (expected: number) => {
    if (version !== expected) throw new AppError('unauthorized', 'Session changed.');
  };
  const accept = (credentials: AuthCredentials, expected: number) => {
    assertCurrent(expected);
    accessToken = credentials.accessToken;
    publish({ status: 'authenticated', user: credentials.user });
  };
  const invalidate = () => {
    if (state.status === 'anonymous') return;
    clear();
    publish({ status: 'anonymous', user: null });
  };
  const refreshAccessToken = (): Promise<string> => {
    if (logoutFlight) return Promise.reject(new AppError('unauthorized', 'Logout in progress.'));
    if (refreshFlight) return refreshFlight;
    const expected = version;
    const previousUser = state.user;
    const flight = repository
      .refresh()
      .then((credentials) => {
        assertCurrent(expected);
        if (previousUser && credentials.user.id !== previousUser.id) {
          throw new AppError('contract', 'Refresh cannot change identity.');
        }
        accept(credentials, expected);
        return credentials.accessToken;
      })
      .catch((error: unknown) => {
        if (version === expected) {
          clear();
          const mapped =
            error instanceof AppError ? error : new AppError('server', 'Session restore failed.');
          publish(
            mapped.kind === 'unauthorized' || mapped.kind === 'forbidden'
              ? { status: 'anonymous', user: null }
              : { status: 'error', user: null, error: mapped, operation: 'restore' },
          );
        }
        throw error;
      })
      .finally(() => {
        if (refreshFlight === flight) refreshFlight = null;
      });
    refreshFlight = flight;
    return flight;
  };
  return {
    getSnapshot: () => state,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getAccessToken: () => accessToken,
    getSessionVersion: () => version,
    invalidate,
    refreshAccessToken,
    async restore() {
      if (state.status === 'authenticated' || logoutFlight || loginFlight) return;
      publish({ status: 'checking', user: null });
      try {
        await refreshAccessToken();
      } catch {
        /* State carries the error; routes stay closed. */
      }
    },
    login(input) {
      const credentials = validateLogin(input);
      if (logoutFlight || loginFlight)
        return Promise.reject(new AppError('validation', 'Authentication operation in progress.'));
      const pendingRefresh = refreshFlight;
      clear();
      const expected = version;
      const flight = (async () => {
        // Wait for a previous cookie-writing request before establishing another identity.
        await pendingRefresh?.catch(() => undefined);
        assertCurrent(expected);
        const result = await repository.login(credentials);
        accept(result, expected);
      })()
        .catch((error: unknown) => {
          if (version === expected) publish({ status: 'anonymous', user: null });
          throw error;
        })
        .finally(() => {
          if (loginFlight === flight) loginFlight = null;
        });
      loginFlight = flight;
      return flight;
    },
    logout() {
      if (logoutFlight) return logoutFlight;
      const pending = [refreshFlight, loginFlight].filter(
        (promise): promise is Promise<string> | Promise<void> => promise !== null,
      );
      clear();
      const expected = version;
      publish({ status: 'signing-out', user: null });
      const flight = (async () => {
        // Let in-flight Set-Cookie responses settle, then revoke the latest cookie.
        await Promise.allSettled(pending);
        try {
          await repository.logout();
          assertCurrent(expected);
          publish({ status: 'anonymous', user: null });
        } catch (error) {
          if (version !== expected) return;
          if (error instanceof AppError && error.kind === 'unauthorized') {
            publish({ status: 'anonymous', user: null });
          } else {
            publish({
              status: 'error',
              user: null,
              operation: 'logout',
              error: error instanceof AppError ? error : new AppError('server', 'Logout failed.'),
            });
          }
        }
      })().finally(() => {
        if (logoutFlight === flight) logoutFlight = null;
      });
      logoutFlight = flight;
      return flight;
    },
  };
}
