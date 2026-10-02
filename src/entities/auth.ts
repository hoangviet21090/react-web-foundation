import { DomainError } from '@/entities/domain-error';

export type Permission = `${string}:${string}`;
export interface AuthUser {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly permissions: readonly Permission[];
}
export interface LoginCredentials {
  email: string;
  password: string;
}
export function validateLogin(input: LoginCredentials): LoginCredentials {
  const email = input.email.trim().toLowerCase();
  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    email.length > 254 ||
    input.password.length < 1 ||
    input.password.length > 128
  ) {
    throw new DomainError('INVALID_LOGIN_INPUT', 'Invalid login input.');
  }
  return { email, password: input.password };
}
export function hasPermission(user: AuthUser | null, permission: Permission): boolean {
  return user?.permissions.includes(permission) ?? false;
}
