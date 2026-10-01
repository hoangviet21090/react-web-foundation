import { requireResult } from '@/shared/infrastructure/http/response';
import { withApplicationErrors } from '@/shared/infrastructure/http/application-errors';
import type { AuthRepository } from '@/features/auth/application/ports/auth-repository';
import type { AuthCredentials } from '@/features/auth/application/auth-credentials';
import type { HttpAuthService } from '../services/http-auth-service';
import type { AuthCredentialsDto } from '../dto/auth-dto';

const toCredentials = (credentials: AuthCredentialsDto): AuthCredentials => ({
  accessToken: credentials.accessToken,
  expiresInSeconds: credentials.expiresInSeconds,
  user: {
    id: credentials.user.id,
    name: credentials.user.name,
    email: credentials.user.email,
    permissions: [...credentials.user.permissions],
  },
});
export function createHttpAuthRepository(service: HttpAuthService): AuthRepository {
  return {
    login(credentials) {
      return withApplicationErrors(async () =>
        toCredentials(requireResult(await service.login(credentials))),
      );
    },
    refresh() {
      return withApplicationErrors(async () =>
        toCredentials(requireResult(await service.refresh())),
      );
    },
    logout() {
      return withApplicationErrors(async () => {
        requireResult(await service.logout());
      });
    },
  };
}
