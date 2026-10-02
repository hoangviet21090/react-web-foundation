import type { LoginCredentials } from '@/entities/auth';
import type { AppThunk, StoreDependencies } from '@/store/store';

function requireSession(dependencies: StoreDependencies) {
  if (!dependencies.auth) throw new Error('Auth session is not configured.');
  return dependencies.auth;
}
export const restoreSession = (): AppThunk<Promise<void>> => (_dispatch, _getState, dependencies) =>
  requireSession(dependencies).restore();

export const login =
  (credentials: LoginCredentials): AppThunk<Promise<void>> =>
  (_dispatch, _getState, dependencies) =>
    requireSession(dependencies).login(credentials);

export const logout = (): AppThunk<Promise<void>> => (_dispatch, _getState, dependencies) =>
  requireSession(dependencies).logout();
