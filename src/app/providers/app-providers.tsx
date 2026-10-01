import { DiagnosticsContext } from '../observability/diagnostics-context';
import { NotificationProvider } from '@/shared/providers/notification-provider';
import { lazy, Suspense } from 'react';
import type { PropsWithChildren } from 'react';
import { Provider } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { AuthProvider } from '@/features/auth/presentation/providers/auth-provider';
import { PreferencesSync } from '../preferences/preferences-sync';
import { ProjectsProvider } from '@/features/projects/presentation/providers/projects-provider';
import type { AppDependencies } from '../composition-root';
import { ErrorBoundary } from '../errors/error-boundary';
import { ErrorPage } from '../errors/error-page';
const Devtools = import.meta.env.DEV
  ? lazy(async () => ({
      default: (await import('@tanstack/react-query-devtools')).ReactQueryDevtools,
    }))
  : null;

export function AppProviders({
  dependencies,
  children,
}: PropsWithChildren<{ dependencies: AppDependencies }>) {
  return (
    <I18nextProvider i18n={dependencies.i18n}>
      <DiagnosticsContext value={dependencies.reporter}>
        <ErrorBoundary reporter={dependencies.reporter} fallback={<ErrorPage />}>
          <Provider store={dependencies.store}>
            <QueryClientProvider client={dependencies.queryClient}>
              <PreferencesSync />
              <NotificationProvider>
                <AuthProvider session={dependencies.auth}>
                  <ProjectsProvider useCases={dependencies.projects}>{children}</ProjectsProvider>
                </AuthProvider>
              </NotificationProvider>
              {Devtools && (
                <Suspense fallback={null}>
                  <Devtools initialIsOpen={false} />
                </Suspense>
              )}
            </QueryClientProvider>
          </Provider>
        </ErrorBoundary>
      </DiagnosticsContext>
    </I18nextProvider>
  );
}
