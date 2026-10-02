import { createErrorReporter } from '@/utils/error-reporter';
import { createProjectUseCases } from '@/usecases/project-usecases';
import { createProjectService } from '@/services/project-service';
import { createAuthSession } from '@/usecases/auth-session';
import { createAuthService } from '@/services/auth-service';
import { createHttpClient } from '@/config/http/http-client';
import { createQueryClient } from '@/config/query-client';
import { createI18n } from '@/config/i18n';
import { createPreferencesStorage } from '@/store/preferences/preferences-storage';
import { env } from '@/config/env';
import { createAppStore } from '@/store/store';

let currentRuntime: AppRuntime | undefined;

export async function createAppRuntime() {
  const preferencesStorage = createPreferencesStorage({
    getItem: (key) => window.localStorage.getItem(key),
    setItem: (key, value) => window.localStorage.setItem(key, value),
  });
  const preferences = preferencesStorage.load({
    language: env.VITE_DEFAULT_LOCALE,
    theme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
  });
  const i18n = await createI18n(preferences.language, env.VITE_APP_NAME);
  const reporter = createErrorReporter();
  const queryClient = createQueryClient(reporter);
  const httpOptions = { baseURL: env.VITE_API_BASE_URL, timeoutMs: env.VITE_API_TIMEOUT_MS };
  // Refresh uses a separate client so its own 401 cannot trigger another refresh.
  const auth = createAuthSession(createAuthService(createHttpClient(httpOptions)), () => {
    void queryClient.cancelQueries();
    queryClient.clear();
  });
  const store = createAppStore(preferences, {
    auth,
    savePreferences: (value) => preferencesStorage.save(value),
    changeLanguage: async (language) => {
      await i18n.changeLanguage(language);
    },
  });
  const http = createHttpClient({ ...httpOptions, auth });
  const projects = createProjectUseCases(createProjectService(http));
  const runtime = { store, queryClient, projects, auth, i18n, reporter };
  currentRuntime = runtime;
  return runtime;
}
export type AppRuntime = Awaited<ReturnType<typeof createAppRuntime>>;

export function getAppRuntime(): AppRuntime {
  if (!currentRuntime) throw new Error('App runtime has not been initialized.');
  return currentRuntime;
}
