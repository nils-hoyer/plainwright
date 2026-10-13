import { expect, test as setup } from '@playwright/test';

// Logs in once per test run and saves the session (cookies and local storage) for the
// "chromium-logged-in" project in playwright.config.ts. See docs/logging-in.md.
setup('log in', async ({ page }) => {
  await page.goto('/login.html');
  await page.getByLabel('Username').fill('1234567890');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Log in' }).click();
  await page.getByRole('button', { name: 'Close' }).click();
  await expect(page.getByText('Signed in as 1234567890')).toBeVisible();
  await page.context().storageState({ path: 'playwright/.auth/user.json' });
});
