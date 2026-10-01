import type { AuthUser } from '@/features/auth/domain/auth';
/** Internal session credentials; excluded from public UI snapshots and persisted state. */
export interface AuthCredentials {
  readonly accessToken: string;
  readonly expiresInSeconds: number;
  readonly user: AuthUser;
}
