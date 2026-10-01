import { setupWorker } from 'msw/browser';
import { handlers, mockApiUrl } from './handlers';
export async function startMocks() {
  const worker = setupWorker(...handlers);
  await worker.start({
    quiet: true,
    onUnhandledRequest(request, print) {
      if (request.url.startsWith(mockApiUrl.replace(/\/projects$/, '/'))) print.error();
    },
    serviceWorker: { url: '/mockServiceWorker.js' },
  });
}
