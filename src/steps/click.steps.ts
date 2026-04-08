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
  await world.locator(page, selector).click();
});

When('I double click the {string}', async ({ page, world }, reference: string) => {
  const selector = world.resolve(reference);
  await world.locator(page, selector).dblclick();
});

When('I right click the {string}', async ({ page, world }, reference: string) => {
  const selector = world.resolve(reference);
  await world.locator(page, selector).click({ button: 'right' });
});

When('I hover over {string}', async ({ page, world }, reference: string) => {
  const selector = world.resolve(reference);
  await world.locator(page, selector).hover();
});

When('I focus on {string}', async ({ page, world }, reference: string) => {
  const selector = world.resolve(reference);
  await world.locator(page, selector).focus();
});

When('I click the text {string}', async ({ page, world }, text: string) => {
  await world.getContext(page).getByText(text).click();
});

When('I click the button {string}', async ({ page, world }, name: string) => {
  await world.getContext(page).getByRole('button', { name }).click();
});

When('I click the link {string}', async ({ page, world }, name: string) => {
  await world.getContext(page).getByRole('link', { name }).click();
});
