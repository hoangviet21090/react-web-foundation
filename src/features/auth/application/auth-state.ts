import type { AppError } from '@/shared/application/app-error';
import type { AuthUser } from '@/features/auth/domain/auth';

/** Session workflow state; separate from identity and business invariants. */
export type AuthState =
  | { status: 'checking' | 'anonymous' | 'signing-out'; user: null }
  | { status: 'authenticated'; user: AuthUser }
  | { status: 'error'; user: null; error: AppError; operation: 'restore' | 'logout' };
