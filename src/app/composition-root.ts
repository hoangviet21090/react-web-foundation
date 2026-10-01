import { createErrorReporter } from '@/shared/infrastructure/observability/error-reporter';
import { createProjectUseCases } from '@/features/projects/application/project-use-cases';
import { createHttpProjectRepository } from '@/features/projects/infrastructure/repositories/http-project-repository';
import { createHttpProjectService } from '@/features/projects/infrastructure/services/http-project-service';
import { createAuthSession } from '@/features/auth/application/auth-session';
import { createHttpAuthService } from '@/features/auth/infrastructure/services/http-auth-service';
import { createHttpAuthRepository } from '@/features/auth/infrastructure/repositories/http-auth-repository';
import { createHttpClient } from '@/shared/infrastructure/http/http-client';
import { createQueryClient } from '@/shared/infrastructure/query-client';
import { createI18n } from '@/shared/infrastructure/i18n/i18n';
import { createPreferencesStorage } from './preferences/preferences-storage';
import { env } from '@/shared/infrastructure/config/env';
import { createAppStore } from './store/store';

export async function createAppDependencies() {
  const preferencesStorage = createPreferencesStorage({
    getItem: (key) => window.localStorage.getItem(key),
    setItem: (key, value) => window.localStorage.setItem(key, value),
  });
  const preferences = preferencesStorage.load({
    language: env.VITE_DEFAULT_LOCALE,
    theme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
  });
  const i18n = await createI18n(preferences.language, env.VITE_APP_NAME);
  const store = createAppStore(preferences, {
    savePreferences: (value) => preferencesStorage.save(value),
    changeLanguage: async (language) => {
      await i18n.changeLanguage(language);
    },
  });
  const reporter = createErrorReporter();
  const queryClient = createQueryClient(reporter);
  const httpOptions = { baseURL: env.VITE_API_BASE_URL, timeoutMs: env.VITE_API_TIMEOUT_MS };
  // Auth endpoints use a separate client: a refresh 401 must never refresh itself.
  const authHttp = createHttpClient(httpOptions);
  const auth = createAuthSession(createHttpAuthRepository(createHttpAuthService(authHttp)), () => {
    void queryClient.cancelQueries();
    queryClient.clear();
  });
  const http = createHttpClient({ ...httpOptions, auth });
  const projects = createProjectUseCases(
    createHttpProjectRepository(createHttpProjectService(http)),
  );
  return { store, queryClient, projects, auth, i18n, reporter };
}
export type AppDependencies = Awaited<ReturnType<typeof createAppDependencies>>;
