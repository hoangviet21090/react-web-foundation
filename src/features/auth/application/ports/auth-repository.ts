import type { LoginCredentials } from '@/features/auth/domain/auth';
import type { AuthCredentials } from '../auth-credentials';
export interface AuthRepository {
  login(credentials: LoginCredentials): Promise<AuthCredentials>;
  refresh(): Promise<AuthCredentials>;
  logout(): Promise<void>;
}
