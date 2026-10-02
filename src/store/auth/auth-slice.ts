import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { AuthState } from '@/usecases/auth-session';
import type { ErrorKind } from '@/usecases/app-error';

export interface AuthFailure {
  kind: ErrorKind;
  message: string;
  code?: string | number;
  retryable: boolean;
}
export type AuthStoreState =
  | Exclude<AuthState, { status: 'error' }>
  | { status: 'error'; user: null; error: AuthFailure; operation: 'restore' | 'logout' };

export function toAuthStoreState(state: AuthState): AuthStoreState {
  if (state.status !== 'error') return state;
  return {
    ...state,
    error: {
      kind: state.error.kind,
      message: state.error.message,
      ...(state.error.code === undefined ? {} : { code: state.error.code }),
      retryable: state.error.retryable,
    },
  };
}
const slice = createSlice({
  name: 'auth',
  initialState: (): AuthStoreState => ({ status: 'checking', user: null }),
  reducers: {
    authStateChanged: (_state, action: PayloadAction<AuthStoreState>) => action.payload,
  },
});
export const { authStateChanged } = slice.actions;
export const authReducer = slice.reducer;
export const selectAuth = (state: { auth: AuthStoreState }) => state.auth;
