import { When, Then } from '../fixtures/world';

// ---------------------------------------------------------------------------
// Wait steps
//
// Supported step patterns:
//   When I wait {int} seconds
//   When I wait {int} milliseconds
//   When I wait for the element "button submit" to be visible
//   When I wait for the element "button submit" to be hidden
//   When I wait for the element "button submit" to be enabled
//   Then the element "button submit" is visible within {int} seconds
//   Then the element "button submit" is hidden within {int} seconds
// ---------------------------------------------------------------------------

When('I wait {int} seconds', async ({}, seconds: number) => {
  await new Promise((resolve) => setTimeout(resolve, seconds * 1000));
});

When('I wait {int} milliseconds', async ({}, ms: number) => {
  await new Promise((resolve) => setTimeout(resolve, ms));
});

When(
  'I wait for the element {string} to be visible',
  async ({ page, world }, reference: string) => {
    const selector = world.resolve(reference);
    await page.locator(selector).waitFor({ state: 'visible' });
  },
);

When('I wait for the element {string} to be hidden', async ({ page, world }, reference: string) => {
  const selector = world.resolve(reference);
  await page.locator(selector).waitFor({ state: 'hidden' });
});

When(
  'I wait for the element {string} to be enabled',
  async ({ page, world }, reference: string) => {
    const selector = world.resolve(reference);
    await page.locator(selector).waitFor({ state: 'visible' });
  },
);

Then(
  'the element {string} is visible within {int} seconds',
  async ({ page, world }, reference: string, seconds: number) => {
    const selector = world.resolve(reference);
    await page.locator(selector).waitFor({ state: 'visible', timeout: seconds * 1000 });
  },
);

Then(
  'the element {string} is hidden within {int} seconds',
  async ({ page, world }, reference: string, seconds: number) => {
    const selector = world.resolve(reference);
    await page.locator(selector).waitFor({ state: 'hidden', timeout: seconds * 1000 });
  },
);
