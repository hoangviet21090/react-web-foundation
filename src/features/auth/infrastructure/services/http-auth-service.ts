import type { HttpClient } from '@/shared/infrastructure/http/http-client';
import { parseResponse } from '@/shared/infrastructure/http/response';
import type { LoginCredentials } from '@/features/auth/domain/auth';
import { authCredentialsDtoSchema, logoutResultDtoSchema } from '../dto/auth-dto';
// Proposed template contract. Replace this adapter when adopting another identity service.
export const AUTH_ENDPOINTS = {
  login: '/auth/login',
  refresh: '/auth/refresh',
  logout: '/auth/logout',
} as const;
export function createHttpAuthService(http: HttpClient) {
  return {
    async login(credentials: LoginCredentials) {
      const response = await http.post<unknown>(AUTH_ENDPOINTS.login, credentials);
      return parseResponse(response.data, authCredentialsDtoSchema);
    },
    async refresh() {
      const response = await http.post<unknown>(AUTH_ENDPOINTS.refresh, {});
      return parseResponse(response.data, authCredentialsDtoSchema);
    },
    async logout() {
      const response = await http.post<unknown>(AUTH_ENDPOINTS.logout, {});
      return parseResponse(response.data, logoutResultDtoSchema);
    },
  };
}
export type HttpAuthService = ReturnType<typeof createHttpAuthService>;
