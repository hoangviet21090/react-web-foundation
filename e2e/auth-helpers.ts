import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';
export async function signIn(page: Page, email = 'demo@example.test', destination = '/projects') {
  await page.goto(destination);
  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel('Ngôn ngữ').selectOption('en');
  await expect(page.getByRole('heading', { name: 'Sign in', exact: true })).toBeVisible();
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill('Demo123!');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
}
