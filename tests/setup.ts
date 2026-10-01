import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import { server } from './server';
import { resetMockAuth } from '@/mocks/auth-handlers';
import { resetMockDatabase } from '@/mocks/handlers';
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});
afterEach(() => {
  cleanup();
  server.resetHandlers();
  resetMockDatabase();
  resetMockAuth();
});
afterAll(() => {
  server.close();
});
