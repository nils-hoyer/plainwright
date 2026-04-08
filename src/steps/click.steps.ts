import { When } from '../fixtures/world';

// ---------------------------------------------------------------------------
// Click & mouse interaction steps
//
// Supported step patterns:
//   When I click the "button login"
//   When I click the "login > button login"
//   When I click the "#submit"
//   When I double click the "button login"
//   When I right click the "button login"
//   When I hover over "button login"
//   When I focus on "input username"
// ---------------------------------------------------------------------------

When('I click the {string}', async ({ page, world }, reference: string) => {
  const selector = world.resolve(reference);
  await page.locator(selector).click();
});

When('I double click the {string}', async ({ page, world }, reference: string) => {
  const selector = world.resolve(reference);
  await page.locator(selector).dblclick();
});

When('I right click the {string}', async ({ page, world }, reference: string) => {
  const selector = world.resolve(reference);
  await page.locator(selector).click({ button: 'right' });
});

When('I hover over {string}', async ({ page, world }, reference: string) => {
  const selector = world.resolve(reference);
  await page.locator(selector).hover();
});

When('I focus on {string}', async ({ page, world }, reference: string) => {
  const selector = world.resolve(reference);
  await page.locator(selector).focus();
});

When('I click the text {string}', async ({ page }, text: string) => {
  await page.getByText(text).click();
});

When('I click the button {string}', async ({ page }, name: string) => {
  await page.getByRole('button', { name }).click();
});

When('I click the link {string}', async ({ page }, name: string) => {
  await page.getByRole('link', { name }).click();
});
