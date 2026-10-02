import { observeBrowserErrors } from '@/utils/error-reporter';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router/dom';
import { env } from '@/config/env';
import { createAppRuntime } from '@/config/runtime';
import { createAppRouter } from '@/routes/router';
import { AppProviders } from '@/providers/app-providers';
import { restoreSession } from '@/store/auth/auth-thunks';

export async function bootstrap() {
  if (
    (import.meta.env.MODE === 'mock' || import.meta.env.MODE === 'demo') &&
    env.VITE_ENABLE_MOCKS === 'true'
  ) {
    const { startMocks } = await import('@/mocks/browser');
    await startMocks();
  }
  const runtime = await createAppRuntime();
  const stopObserving = observeBrowserErrors(runtime.reporter);
  void runtime.store.dispatch(restoreSession());
  const router = createAppRouter();
  const element = document.getElementById('root');
  if (!element) throw new Error('Missing root element.');
  const root = createRoot(element);
  root.render(
    <StrictMode>
      <AppProviders runtime={runtime}>
        <RouterProvider router={router} />
      </AppProviders>
    </StrictMode>,
  );
  if (import.meta.hot)
    import.meta.hot.dispose(() => {
      stopObserving();
      router.dispose();
      root.unmount();
      runtime.store.dispose();
      runtime.queryClient.clear();
    });
}
