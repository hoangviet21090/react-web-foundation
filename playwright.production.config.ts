import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/production',
  expect: { timeout: 15_000 },
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  outputDir: 'test-results/production',
  reporter: [['list'], ['html', { outputFolder: 'playwright-report/production', open: 'never' }]],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://127.0.0.1:4175',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run preview -- --port 4175',
    url: 'http://127.0.0.1:4175',
    // Always serve this workspace's dist; never reuse an unrelated server.
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
