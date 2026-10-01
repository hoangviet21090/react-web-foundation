import { useContext, useSyncExternalStore } from 'react';
import { AuthContext } from '../contexts/auth-context';
export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('AuthProvider is required.');
  const state = useSyncExternalStore(auth.subscribe, auth.getSnapshot, auth.getSnapshot);
  return { auth, state };
}
