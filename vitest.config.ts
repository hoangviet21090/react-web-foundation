import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'tests/**/*.test.{ts,tsx}'],
    restoreMocks: true,
    clearMocks: true,
    env: { VITE_API_BASE_URL: 'http://localhost/api', VITE_ENABLE_MOCKS: 'false' },
    coverage: {
      provider: 'v8',
      include: [
        'src/entities/**/*.ts',
        'src/usecases/**/*.ts',
        'src/services/**/*.ts',
        'src/config/http/**/*.ts',
        'src/store/**/*.ts',
      ],
      exclude: ['**/*.test.*'],
      reporter: ['text', 'lcov', 'html'],
      thresholds: { lines: 85, functions: 85, branches: 75, statements: 85 },
    },
  },
});
