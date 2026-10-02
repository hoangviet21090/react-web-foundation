import { lazy, Suspense } from 'react';
import type { PropsWithChildren } from 'react';
import { Provider } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import type { AppRuntime } from '@/config/runtime';
import { NotificationProvider } from '@/providers/notification-provider';
import { PreferencesSync } from '@/components/preferences-sync';
import { ErrorBoundary } from '@/components/error-boundary';
import { ErrorPage } from '@/pages/error-page';

const Devtools = import.meta.env.DEV
  ? lazy(async () => ({
      default: (await import('@tanstack/react-query-devtools')).ReactQueryDevtools,
    }))
  : null;

export function AppProviders({ runtime, children }: PropsWithChildren<{ runtime: AppRuntime }>) {
  return (
    <I18nextProvider i18n={runtime.i18n}>
      <ErrorBoundary fallback={<ErrorPage />}>
        <Provider store={runtime.store}>
          <QueryClientProvider client={runtime.queryClient}>
            <PreferencesSync />
            <NotificationProvider>{children}</NotificationProvider>
            {Devtools && (
              <Suspense fallback={null}>
                <Devtools initialIsOpen={false} />
              </Suspense>
            )}
          </QueryClientProvider>
        </Provider>
      </ErrorBoundary>
    </I18nextProvider>
  );
}
