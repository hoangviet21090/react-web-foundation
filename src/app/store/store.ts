import { configureStore } from '@reduxjs/toolkit';
import type { UnknownAction } from '@reduxjs/toolkit';
import type { ThunkAction } from 'redux-thunk';
import { preferencesReducer } from '../preferences/preferences-slice';
import type { Preferences } from '../preferences/preferences-schema';

export interface StoreDependencies {
  savePreferences(value: Preferences): void;
  changeLanguage(language: 'vi' | 'en'): Promise<void>;
}
export function createAppStore(preferences: Preferences, dependencies: StoreDependencies) {
  return configureStore({
    reducer: { preferences: preferencesReducer },
    preloadedState: { preferences },
    // RTK includes redux-thunk: configure it once, keep serializability/immutability checks.
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ thunk: { extraArgument: dependencies } }),
    devTools: import.meta.env.DEV,
  });
}
export type AppStore = ReturnType<typeof createAppStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
export type AppThunk<R = void> = ThunkAction<R, RootState, StoreDependencies, UnknownAction>;
