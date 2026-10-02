import { useMemo } from 'react';
import { AppError } from '@/usecases/app-error';
import type { LoginCredentials } from '@/entities/auth';
import type { AuthState } from '@/usecases/auth-session';
import { useAppDispatch, useAppSelector } from '@/hooks/use-store';
import { selectAuth } from '@/store/auth/auth-slice';
import { login, logout, restoreSession } from '@/store/auth/auth-thunks';

export function useAuth() {
  const dispatch = useAppDispatch();
  const snapshot = useAppSelector(selectAuth);
  const state: AuthState = useMemo(
    () =>
      snapshot.status === 'error'
        ? {
            ...snapshot,
            error: new AppError(snapshot.error.kind, snapshot.error.message, snapshot.error),
          }
        : snapshot,
    [snapshot],
  );
  const auth = useMemo(
    () => ({
      restore: () => dispatch(restoreSession()),
      login: (credentials: LoginCredentials) => dispatch(login(credentials)),
      logout: () => dispatch(logout()),
    }),
    [dispatch],
  );
  return { auth, state };
}
