import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import type { Plugin } from 'vite';

const workerPath = createRequire(import.meta.url).resolve('msw/mockServiceWorker.js');

/** Serve the worker from the pinned MSW package only in explicitly enabled mock/demo modes. */
export function mockWorker(enabled: boolean): Plugin | null {
  if (!enabled) return null;
  const source = readFileSync(workerPath, 'utf8');
  return {
    name: 'foundation-mock-worker',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const pathname = new URL(request.url ?? '/', 'http://localhost').pathname;
        if (pathname !== '/mockServiceWorker.js') return next();
        if (request.method !== 'GET' && request.method !== 'HEAD') {
          response.writeHead(405, { Allow: 'GET, HEAD' });
          response.end();
          return;
        }
        response.writeHead(200, {
          'Content-Type': 'text/javascript; charset=utf-8',
          'Cache-Control': 'no-cache',
        });
        response.end(request.method === 'HEAD' ? undefined : source);
      });
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'mockServiceWorker.js', source });
    },
  };
}
