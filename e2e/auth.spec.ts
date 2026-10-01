import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { signIn } from './auth-helpers';

test('guards deep links, validates login, restores session and prevents access after logout', async ({
  page,
}, testInfo) => {
  let projectsRequests = 0;
  page.on('request', (request) => {
    if (new URL(request.url()).pathname === '/api/projects') projectsRequests++;
  });
  await page.goto('/projects/new?from=deep-link');
  await expect(page).toHaveURL(/\/login$/);
  expect(projectsRequests).toBe(0);
  await page.getByLabel('Ngôn ngữ').selectOption('en');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByText('Enter a valid email address.')).toBeVisible();
  await page.getByLabel('Email', { exact: true }).fill('demo@example.test');
  await page.getByLabel('Password', { exact: true }).fill('wrong');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(
    page.getByRole('alert').filter({ hasText: 'Email or password is incorrect.' }),
  ).toBeVisible();
  expect(projectsRequests).toBe(0);
  await page.getByLabel('Password', { exact: true }).fill('Demo123!');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(/\/projects\/new\?from=deep-link$/);
  await expect(page.getByRole('heading', { name: 'New project' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'New project' })).toBeVisible();
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([
    'web-foundation:preferences:v1',
  ]);
  const sessionData = await page.evaluate(() => ({
    keys: Object.keys(sessionStorage),
    scrollPositions: sessionStorage.getItem('react-router-scroll-positions'),
  }));
  expect(sessionData.keys).toEqual(['react-router-scroll-positions']);
  const positions: unknown = JSON.parse(sessionData.scrollPositions ?? '{}');
  expect(typeof positions).toBe('object');
  expect(positions).not.toBeNull();
  expect(Array.isArray(positions)).toBe(false);
  expect(
    Object.values(positions as Record<string, unknown>).every(
      (position) => typeof position === 'number' && Number.isFinite(position),
    ),
  ).toBe(true);
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Sign in', exact: true })).toBeVisible();
  await page.goto('/projects');
  await expect(page).toHaveURL(/\/login$/);
  await page.screenshot({ path: testInfo.outputPath('login.png'), fullPage: true });
});

test('expired access token refreshes automatically; expired refresh session returns to login', async ({
  page,
  context,
}) => {
  await page.clock.install();
  let refreshes = 0;
  page.on('request', (request) => {
    if (request.url().endsWith('/api/auth/refresh')) refreshes++;
  });
  await signIn(page);
  await expect(page.getByRole('cell', { name: 'Nguyễn An (demo)' })).toBeVisible();
  const initial = refreshes;
  await page.clock.fastForward(31_000);
  await page.getByRole('textbox', { name: 'Search by name or reference' }).fill('PRJ-DEMO-001');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(page.getByText('Page 1 / 1 · 1 projects')).toBeVisible();
  expect(refreshes).toBe(initial + 1);
  await context.clearCookies();
  await page.clock.fastForward(31_000);
  await page.getByRole('textbox', { name: 'Search by name or reference' }).fill('PRJ-DEMO-002');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('table')).toHaveCount(0);
  expect(refreshes).toBe(initial + 2);
});

test('viewer has read-only route and API permissions, switching user clears protected data', async ({
  page,
}) => {
  const loginResponse = page.waitForResponse(
    (response) => response.url().endsWith('/api/auth/login') && response.status() === 200,
  );
  await signIn(page, 'viewer@example.test');
  const payload: unknown = await (await loginResponse).json();
  if (
    !payload ||
    typeof payload !== 'object' ||
    !('result' in payload) ||
    !payload.result ||
    typeof payload.result !== 'object' ||
    !('accessToken' in payload.result) ||
    typeof payload.result.accessToken !== 'string'
  )
    throw new Error('Invalid test auth payload');
  const token = payload.result.accessToken;
  await expect(page.getByRole('heading', { name: 'Projects overview' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'New project', exact: true })).toHaveCount(0);
  const status = await page.evaluate(async (bearer) => {
    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + bearer, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Forbidden demo', budget: 100 }),
    });
    return response.status;
  }, token);
  expect(status).toBe(403);
  await page.goto('/projects/new');
  await expect(page.getByRole('heading', { name: 'Access denied' })).toBeVisible();
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel('Email', { exact: true }).fill('demo@example.test');
  await page.getByLabel('Password', { exact: true }).fill('Demo123!');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'New project' })).toBeVisible();
});

test('login is accessible in both themes and redirects authenticated users', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Đăng nhập', exact: true })).toBeVisible();
  await page.getByLabel('Ngôn ngữ').selectOption('en');
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
      .violations,
  ).toEqual([]);
  await page.getByRole('button', { name: 'Toggle theme' }).click();
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
      .violations,
  ).toEqual([]);
  await page.getByLabel('Email', { exact: true }).fill('demo@example.test');
  await page.getByLabel('Password', { exact: true }).fill('Demo123!');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Projects overview' })).toBeVisible();
  await page.goto('/login');
  await expect(page).toHaveURL(/\/projects$/);
});
