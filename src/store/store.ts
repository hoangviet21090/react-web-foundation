import { configureStore } from '@reduxjs/toolkit';
import type { UnknownAction } from '@reduxjs/toolkit';
import type { ThunkAction } from 'redux-thunk';
import { preferencesReducer } from '@/store/preferences/preferences-slice';
import type { Preferences } from '@/store/preferences/preferences-schema';
import type { AuthSession } from '@/usecases/auth-session';
import { authReducer, authStateChanged, toAuthStoreState } from '@/store/auth/auth-slice';

export interface StoreDependencies {
  savePreferences(value: Preferences): void;
  changeLanguage(language: 'vi' | 'en'): Promise<void>;
  auth?: AuthSession;
}
export function createAppStore(preferences: Preferences, dependencies: StoreDependencies) {
  const store = configureStore({
    reducer: { preferences: preferencesReducer, auth: authReducer },
    preloadedState: { preferences },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ thunk: { extraArgument: dependencies } }),
    devTools: import.meta.env.DEV,
  });
  let stopAuthSync: (() => void) | undefined;
  if (dependencies.auth) {
    const session = dependencies.auth;
    const sync = () => store.dispatch(authStateChanged(toAuthStoreState(session.getSnapshot())));
    stopAuthSync = session.subscribe(sync);
    sync();
  }
  return Object.assign(store, { dispose: () => stopAuthSync?.() });
}
export type AppStore = ReturnType<typeof createAppStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
export type AppThunk<R = void> = ThunkAction<R, RootState, StoreDependencies, UnknownAction>;
