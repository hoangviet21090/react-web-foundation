import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';
import { parseEnv } from './src/shared/infrastructure/config/env-schema.ts';

export default defineConfig(({ mode, command }) => {
  const rawEnv = loadEnv(mode, process.cwd(), '');
  const allowMocks = mode === 'mock' || mode === 'demo';
  const publicEnv = parseEnv(rawEnv, {
    allowMocks,
    requireHttps: command === 'build' && !allowMocks,
  });
  if (command === 'build' && rawEnv.NODE_ENV && rawEnv.NODE_ENV !== 'production') {
    throw new Error(
      'Builds require NODE_ENV=production so development tools cannot enter the bundle.',
    );
  }
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'public-document-config',
        transformIndexHtml(html) {
          const title = publicEnv.VITE_APP_NAME.replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;');
          return html
            .replace(/<title>[^<]*<\/title>/, () => '<title>' + title + '</title>')
            .replace('<html lang="vi">', '<html lang="' + publicEnv.VITE_DEFAULT_LOCALE + '">');
        },
      },
    ],
    // The production build never copies the MSW worker.
    publicDir: allowMocks ? 'public' : false,
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    server: { host: '127.0.0.1', port: 5173, strictPort: true },
    preview: { host: '127.0.0.1', port: 4173, strictPort: true },
    build: {
      target: ['chrome111', 'edge111', 'firefox128', 'safari16.4'],
      sourcemap: false,
      chunkSizeWarningLimit: 600,
    },
  };
});
