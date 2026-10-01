import { observeBrowserErrors } from './observability/browser-errors';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router/dom';
import { env } from '@/shared/infrastructure/config/env';
import { createAppDependencies } from './composition-root';
import { createAppRouter } from './routing/router';
import { AppProviders } from './providers/app-providers';
export async function bootstrap() {
  if (
    (import.meta.env.MODE === 'mock' || import.meta.env.MODE === 'demo') &&
    env.VITE_ENABLE_MOCKS === 'true'
  ) {
    const { startMocks } = await import('@/mocks/browser');
    await startMocks();
  }
  const dependencies = await createAppDependencies();
  const stopObserving = observeBrowserErrors(dependencies.reporter);
  void dependencies.auth.restore();
  const router = createAppRouter();
  const element = document.getElementById('root');
  if (!element) throw new Error('Missing root element.');
  const root = createRoot(element);
  root.render(
    <StrictMode>
      <AppProviders dependencies={dependencies}>
        <RouterProvider router={router} />
      </AppProviders>
    </StrictMode>,
  );
  if (import.meta.hot)
    import.meta.hot.dispose(() => {
      stopObserving();
      router.dispose();
      root.unmount();
      dependencies.queryClient.clear();
    });
}
