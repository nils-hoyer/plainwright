import { expect } from '@playwright/test';
import { When, Then } from '../fixtures/world';

// ---------------------------------------------------------------------------
// Cookie & Storage steps
//
// Supported step patterns:
//   When I set the cookie "session" to "abc123"
//   When I delete the cookie "session"
//   When I clear all cookies
//   When I set local storage "key" to "value"
//   When I clear local storage
//   Then the cookie "session" exists
//   Then the cookie "session" does not exist
//   Then the cookie "session" has value "abc123"
//   Then local storage "key" equals "value"
// ---------------------------------------------------------------------------

When('I set the cookie {string} to {string}', async ({ page }, name: string, value: string) => {
  const url = page.url();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    throw new Error(
      `[playwright-bdd-steps] Cannot set cookie: current URL is not HTTP(s): "${url}". Navigate to a page first.`,
    );
  }
  await page.context().addCookies([{ name, value, url }]);
});

When('I delete the cookie {string}', async ({ page }, name: string) => {
  const cookies = await page.context().cookies();
  const remaining = cookies.filter((c) => c.name !== name);
  await page.context().clearCookies();
  if (remaining.length > 0) {
    await page.context().addCookies(remaining);
  }
});

When('I clear all cookies', async ({ page }) => {
  await page.context().clearCookies();
});

When('I set local storage {string} to {string}', async ({ page, world }, key: string, value: string) => {
  await world.getPage(page).evaluate(([k, v]) => localStorage.setItem(k, v), [key, value]);
});

When('I clear local storage', async ({ page, world }) => {
  await world.getPage(page).evaluate(() => localStorage.clear());
});

Then('the cookie {string} exists', async ({ page }, name: string) => {
  const cookies = await page.context().cookies();
  const found = cookies.some((c) => c.name === name);
  if (!found) {
    throw new Error(`[playwright-bdd-steps] Cookie "${name}" not found.`);
  }
});

Then('the cookie {string} does not exist', async ({ page }, name: string) => {
  const cookies = await page.context().cookies();
  const found = cookies.some((c) => c.name === name);
  if (found) {
    throw new Error(`[playwright-bdd-steps] Cookie "${name}" was expected to be absent but exists.`);
  }
});

Then('the cookie {string} has value {string}', async ({ page }, name: string, expected: string) => {
  const cookies = await page.context().cookies();
  const cookie = cookies.find((c) => c.name === name);
  if (!cookie) {
    throw new Error(`[playwright-bdd-steps] Cookie "${name}" not found.`);
  }
  expect(cookie.value).toBe(expected);
});

Then('local storage {string} equals {string}', async ({ page }, key: string, expected: string) => {
  const actual = await page.evaluate((k) => localStorage.getItem(k), key);
  expect(actual).toBe(expected);
});
