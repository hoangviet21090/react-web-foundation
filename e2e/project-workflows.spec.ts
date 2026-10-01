import { expect, test } from '@playwright/test';
import { signIn } from './auth-helpers';

test('project details, edit, version conflict and confirmed deletion', async ({ page }) => {
  await signIn(page);
  await page.getByRole('link', { name: 'PRJ-DEMO-001', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Project details' })).toBeVisible();
  await page.getByRole('link', { name: 'Edit project' }).click();
  await page.getByLabel('Project name').fill('Updated project');
  await page.getByLabel('Status', { exact: true }).selectOption('active');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText('Project updated.')).toBeVisible();
  await page.getByRole('link', { name: 'Go back', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Updated project' })).toBeVisible();
  await page.getByRole('button', { name: 'Delete project', exact: true }).click();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Updated project' })).toBeVisible();
  await page.getByRole('button', { name: 'Delete project', exact: true }).click();
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: 'Delete project', exact: true })
    .click();
  await expect(page).toHaveURL(/\/projects$/);
  await expect(page.getByText('Project deleted.', { exact: true })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Updated project', exact: true })).toHaveCount(0);
});

test('dirty forms protect navigation and retain values after a conflict', async ({ page }) => {
  await signIn(page, 'demo@example.test', '/projects/demo-001/edit');
  await page.getByLabel('Project name').fill('Unsaved edit');
  await page.getByRole('link', { name: 'Go back', exact: true }).click();
  await expect(page.getByRole('alertdialog')).toBeVisible();
  await page.getByRole('button', { name: 'Keep editing' }).click();
  await expect(page.getByLabel('Project name')).toHaveValue('Unsaved edit');
  // A second authenticated writer updates the same version through the actual mock HTTP API.
  await page.evaluate(async () => {
    const login = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'demo@example.test', password: 'Demo123!' }),
    });
    const session = (await login.json()) as { result: { accessToken: string } };
    const response = await fetch('/api/projects/demo-001', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + session.result.accessToken,
        'If-Match': '"1"',
      },
      body: JSON.stringify({ name: 'Other editor', budget: 100, status: 'active' }),
    });
    if (!response.ok) throw new Error('Concurrent update failed');
  });
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText(/This project changed elsewhere/)).toBeVisible();
  await expect(page.getByLabel('Project name')).toHaveValue('Unsaved edit');
  await page.getByRole('link', { name: 'Go back', exact: true }).click();
  await page.getByRole('button', { name: 'Leave page', exact: true }).click();
  await expect(page).toHaveURL(/\/projects\/demo-001$/);
});

test('offline is visible and saving is disabled until reconnection', async ({ page, context }) => {
  await signIn(page, 'demo@example.test', '/projects/new');
  await page.getByLabel('Project name').fill('Offline project');
  await page.getByLabel('Budget (USD)').fill('500');
  await context.setOffline(true);
  await expect(page.getByText(/You are offline/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Create draft', exact: true })).toBeDisabled();
  await context.setOffline(false);
  await expect(page.getByRole('button', { name: 'Create draft', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Create draft', exact: true }).click();
  await expect(page.getByText('Draft created successfully.')).toBeVisible();
});

test('viewer cannot edit or delete a project', async ({ page }) => {
  await signIn(page, 'viewer@example.test', '/projects/demo-001');
  await expect(page.getByRole('heading', { name: 'Project details' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Edit project' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Delete project' })).toHaveCount(0);
  await page.goto('/projects/demo-001/edit');
  await expect(page.getByRole('heading', { name: 'Access denied' })).toBeVisible();
});
