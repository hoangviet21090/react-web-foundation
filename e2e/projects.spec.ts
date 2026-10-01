import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { signIn } from './auth-helpers';

test('list, pagination, search, create and persisted preferences', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await signIn(page);
  await expect(page.getByRole('cell', { name: 'Nguyễn An (demo)' })).toBeVisible();
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('cell', { name: 'Đỗ Lan (demo)' })).toBeVisible();
  await page.getByRole('button', { name: 'Previous' }).click();
  await expect(page.getByRole('heading', { name: 'Projects overview' })).toBeVisible();
  await page.getByRole('button', { name: 'Toggle theme' }).click();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await page.getByRole('link', { name: 'New project', exact: true }).click();
  await page.getByRole('button', { name: 'Create draft' }).click();
  await expect(page.getByText('Use between 2 and 100 characters.')).toBeVisible();
  await page.getByLabel('Project name').fill('Browser Demo');
  await page.getByLabel('Budget (USD)').fill('250000');
  await page.getByRole('button', { name: 'Create draft' }).click();
  await expect(page.getByText('Draft created successfully.')).toBeVisible();
  await page.getByRole('link', { name: 'Go back' }).click();
  await expect(page.getByRole('cell', { name: 'Browser Demo' })).toBeVisible();
  await page
    .getByRole('textbox', { name: 'Search by name or reference' })
    .fill('no matching project');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'No matching projects' })).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Projects overview' })).toBeVisible();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await expect(page.getByRole('cell', { name: 'Nguyễn An (demo)' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: testInfo.outputPath('projects.png'), fullPage: true });
  expect(errors).toEqual([]);
});

test('accessible list and form in both themes, deep links and unknown routes', async ({ page }) => {
  await signIn(page);
  await expect(page.getByRole('cell', { name: 'Nguyễn An (demo)' })).toBeVisible();
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
      .violations,
  ).toEqual([]);
  await page.getByRole('button', { name: 'Toggle theme' }).click();
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
      .violations,
  ).toEqual([]);
  await page.goto('/projects/new');
  await expect(page.getByRole('heading', { name: 'New project' })).toBeVisible();
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
      .violations,
  ).toEqual([]);
  await page.goto('/does-not-exist');
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  let documentRequests = 0;
  page.on('request', (request) => {
    if (request.resourceType() === 'document') documentRequests++;
  });
  await page.getByRole('link', { name: 'Back to projects' }).click();
  await expect(page.getByRole('heading', { name: 'Projects overview' })).toBeVisible();
  expect(documentRequests).toBe(0);
});

test('query navigation preserves unrelated filters and browser history', async ({ page }) => {
  await signIn(page, 'demo@example.test', '/projects?page=invalid&tab=active');
  await expect(page.getByText('Page 1 / 2 · 6 projects')).toBeVisible();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByRole('cell', { name: 'Đỗ Lan (demo)' })).toBeVisible();
  expect(new URL(page.url()).searchParams.get('tab')).toBe('active');
  expect(new URL(page.url()).searchParams.get('page')).toBe('2');
  const search = 'Nguyễn & + # ? / =';
  await page.getByRole('textbox', { name: 'Search by name or reference' }).fill(search);
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'No matching projects' })).toBeVisible();
  let query = new URL(page.url()).searchParams;
  expect(query.get('search')).toBe(search);
  expect(query.get('page')).toBeNull();
  expect(query.get('tab')).toBe('active');
  await page.goBack();
  await expect(page.getByRole('cell', { name: 'Đỗ Lan (demo)' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Search by name or reference' })).toHaveValue('');
  await page.goForward();
  await expect(page.getByRole('textbox', { name: 'Search by name or reference' })).toHaveValue(
    search,
  );
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await expect(page.getByText('Page 1 / 2 · 6 projects')).toBeVisible();
  query = new URL(page.url()).searchParams;
  expect(query.get('tab')).toBe('active');
  expect(query.get('page')).toBeNull();
  expect(query.get('search')).toBeNull();
});
