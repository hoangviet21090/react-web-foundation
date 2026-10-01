import type { PropsWithChildren } from 'react';
import type { AuthSession } from '@/features/auth/application/auth-session';
import { AuthContext } from '../contexts/auth-context';
export function AuthProvider({ session, children }: PropsWithChildren<{ session: AuthSession }>) {
  return <AuthContext value={session}>{children}</AuthContext>;
}
