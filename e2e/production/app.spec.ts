import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

// Test-only HTTP contract stubs. The browser runs the actual production bundle without MSW.
const user = {
  id: 'production-smoke-user',
  name: 'Production Smoke',
  email: 'smoke@example.test',
  permissions: ['projects:read', 'projects:create'],
};
function success(result: unknown) {
  return { success: true, result, errorCode: null, errorDetails: null, message: null };
}
async function stubApi(page: Page) {
  let signedIn = false;
  const projects: unknown[] = [];
  const credentials = () =>
    success({
      accessToken: 'production-smoke-only',
      expiresInSeconds: 900,
      user,
    });
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path === '/api/auth/login') {
      signedIn = true;
      await route.fulfill({ json: credentials() });
    } else if (path === '/api/auth/refresh') {
      await route.fulfill({ status: signedIn ? 200 : 401, json: signedIn ? credentials() : {} });
    } else if (path === '/api/projects' && signedIn) {
      if (request.method() === 'POST') {
        const project = {
          ...(request.postDataJSON() as Record<string, unknown>),
          id: 'production-smoke-project',
          reference: 'SMOKE-001',
          status: 'draft',
          currency: 'USD',
          version: 1,
          createdAt: '2026-10-01T00:00:00Z',
        };
        projects.push(project);
        await route.fulfill({ status: 201, json: success(project) });
      } else {
        await route.fulfill({
          json: success({ items: projects, totalCount: projects.length, page: 1, pageSize: 5 }),
        });
      }
    } else {
      await route.fulfill({ status: 501, json: {} });
    }
  });
}
async function login(page: Page, destination: string) {
  await page.goto(destination);
  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel('Ngôn ngữ').selectOption('en');
  await page.getByLabel('Email', { exact: true }).fill(user.email);
  await page.getByLabel('Password', { exact: true }).fill('SmokeOnly123!');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
}

test('production deep link, lazy form and HTTP mutation work without demo UI or workers', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await stubApi(page);
  await login(page, '/projects/new');
  await expect(page).toHaveURL(/\/projects\/new$/);
  await expect(page.getByRole('heading', { name: 'New project', exact: true })).toBeVisible();
  await expect(page.getByText('Demo data', { exact: true })).toHaveCount(0);
  await expect(page.getByText(/demo@example\.test/)).toHaveCount(0);
  await expect(page).toHaveTitle(/Web Foundation$/);
  await page.getByLabel('Project name').fill('Production Smoke');
  await page.getByLabel('Budget (USD)').fill('1500000');
  await page.getByRole('button', { name: 'Create draft', exact: true }).click();
  await expect(page.getByText('Draft created successfully.')).toBeVisible();
  await page.getByRole('link', { name: 'Go back', exact: true }).click();
  await expect(page.getByRole('cell', { name: 'Production Smoke', exact: true })).toBeVisible();
  const workers = await page.evaluate(
    async () => (await navigator.serviceWorker.getRegistrations()).length,
  );
  expect(workers).toBe(0);
  expect(errors).toEqual([]);
});

test('storage access denied still allows the production sign-in screen', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new DOMException('Storage denied', 'SecurityError');
      },
    });
  });
  await stubApi(page);
  await page.goto('/projects');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByLabel('Email', { exact: true })).toBeVisible();
  await page.getByLabel('Ngôn ngữ').selectOption('en');
  await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible();
});

test('missing lazy chunk shows recovery and a fresh document can load it again', async ({
  page,
}) => {
  await stubApi(page);
  await login(page, '/projects');
  await expect(page.getByRole('heading', { name: 'Projects overview' })).toBeVisible();
  const pattern = '**/assets/new-project-page-*.js';
  let blockedChunk = false;
  await page.route(pattern, (route) => {
    blockedChunk = true;
    return route.abort();
  });
  await page.getByRole('link', { name: 'New project', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Unable to load the application' })).toBeVisible();
  expect(blockedChunk).toBe(true);
  await page.unroute(pattern);
  await page.getByRole('button', { name: 'Back to projects', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Projects overview' })).toBeVisible();
  await page.getByRole('link', { name: 'New project', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'New project', exact: true })).toBeVisible();
});
