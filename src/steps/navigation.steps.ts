import { expect } from '@playwright/test';
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

Given('I navigate to {string}', async ({ page, world }, url: string) => {
  await world.getPage(page).goto(url);
});

// Alias for "I navigate to" — both patterns are equivalent.
When('I visit the url {string}', async ({ page, world }, url: string) => {
  await world.getPage(page).goto(url);
});

When('I go back', async ({ page, world }) => {
  await world.getPage(page).goBack();
});

When('I go forward', async ({ page, world }) => {
  await world.getPage(page).goForward();
});

When('I reload the page', async ({ page, world }) => {
  await world.getPage(page).reload();
});

When('I wait for the page to load', async ({ page, world }) => {
  await world.getPage(page).waitForLoadState('load');
});

When('I wait for network idle', async ({ page, world }) => {
  await world.getPage(page).waitForLoadState('networkidle');
});

When('I wait for the url {string}', async ({ page, world }, url: string) => {
  await world.getPage(page).waitForURL(url);
});

Then('I see the url {string}', async ({ page, world }, url: string) => {
  await expect(world.getPage(page)).toHaveURL(url);
});

Then('the url contains {string}', async ({ page, world }, substring: string) => {
  await expect(world.getPage(page)).toHaveURL(new RegExp(substring.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});

Then('the url does not contain {string}', async ({ page, world }, substring: string) => {
  await expect(world.getPage(page)).not.toHaveURL(
    new RegExp(substring.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
  );
});
