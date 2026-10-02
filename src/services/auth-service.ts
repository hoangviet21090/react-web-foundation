import { AUTH_ENDPOINTS } from '@/constants/endpoints';
import { z } from 'zod';
import type { HttpClient } from '@/config/http/http-client';
import { parseResponse } from '@/config/http/response';
import { requireResult } from '@/usecases/response';
import { withApplicationErrors } from '@/config/http/application-errors';
import type { LoginCredentials } from '@/entities/auth';
import type { AuthCredentials, AuthService } from '@/usecases/auth-session';

const credentialsSchema = z.object({
  accessToken: z.string().min(1),
  expiresInSeconds: z.number().int().positive(),
  user: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    email: z.email(),
    permissions: z.array(
      z.custom<`${string}:${string}`>(
        (value) => typeof value === 'string' && /^[a-z][a-z0-9-]*:[a-z][a-z0-9-]*$/.test(value),
      ),
    ),
  }),
});
const logoutSchema = z.object({ loggedOut: z.literal(true) });

export function createAuthService(http: HttpClient): AuthService {
  const authenticate = (
    endpoint: string,
    credentials?: LoginCredentials,
  ): Promise<AuthCredentials> =>
    withApplicationErrors(async () => {
      const response = await http.post<unknown>(endpoint, credentials ?? {});
      return requireResult(parseResponse(response.data, credentialsSchema));
    });
  return {
    login: (credentials) => authenticate(AUTH_ENDPOINTS.login, credentials),
    refresh: () => authenticate(AUTH_ENDPOINTS.refresh),
    logout: () =>
      withApplicationErrors(async () => {
        const response = await http.post<unknown>(AUTH_ENDPOINTS.logout, {});
        requireResult(parseResponse(response.data, logoutSchema));
      }),
  };
}
