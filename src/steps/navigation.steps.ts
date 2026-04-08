import { Given, When, Then } from '../fixtures/world';

// ---------------------------------------------------------------------------
// Navigation steps
//
// Supported step patterns:
//   Given I navigate to "https://example.com"
//   When I navigate to "https://example.com"
//   When I visit the url "/login"
//   When I go back
//   When I go forward
//   When I reload the page
//   Then I see the url "https://example.com/dashboard"
//   Then the url contains "/dashboard"
//   Then the url does not contain "/login"
// ---------------------------------------------------------------------------

Given('I navigate to {string}', async ({ page }, url: string) => {
  await page.goto(url);
});

When('I visit the url {string}', async ({ page }, url: string) => {
  await page.goto(url);
});

When('I go back', async ({ page }) => {
  await page.goBack();
});

When('I go forward', async ({ page }) => {
  await page.goForward();
});

When('I reload the page', async ({ page }) => {
  await page.reload();
});

When('I wait for the page to load', async ({ page }) => {
  await page.waitForLoadState('load');
});

When('I wait for network idle', async ({ page }) => {
  await page.waitForLoadState('networkidle');
});

When('I wait for the url {string}', async ({ page }, url: string) => {
  await page.waitForURL(url);
});

Then('I see the url {string}', async ({ page }, url: string) => {
  await page.waitForURL(url);
});

Then('the url contains {string}', async ({ page }, substring: string) => {
  await page.waitForURL((u) => u.href.includes(substring));
});

Then('the url does not contain {string}', async ({ page }, substring: string) => {
  const current = page.url();
  if (current.includes(substring)) {
    throw new Error(
      `[playwright-bdd-steps] Expected URL to NOT contain "${substring}" but got: ${current}`,
    );
  }
});
