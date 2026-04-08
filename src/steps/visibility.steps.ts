import { expect } from '@playwright/test';
import { Then } from '../fixtures/world';

// ---------------------------------------------------------------------------
// Visibility & existence assertion steps
//
// Supported step patterns:
//   Then I see the "button login"
//   Then I do not see the "button login"
//   Then I see the text "Welcome"
//   Then I do not see the text "Error"
//   Then I see the text "Welcome" in the "header"
//   Then {int} elements of "li.item" are visible
// ---------------------------------------------------------------------------

Then('I see the {string}', async ({ page, world }, reference: string) => {
  const selector = world.resolve(reference);
  await expect(world.locator(page, selector)).toBeVisible();
});

Then('I do not see the {string}', async ({ page, world }, reference: string) => {
  const selector = world.resolve(reference);
  await expect(world.locator(page, selector)).toBeHidden();
});

Then('I see the text {string}', async ({ page, world }, text: string) => {
  await expect(world.getContext(page).getByText(text, { exact: false })).toBeVisible();
});

Then('I do not see the text {string}', async ({ page, world }, text: string) => {
  await expect(world.getContext(page).getByText(text, { exact: false })).toBeHidden();
});

Then(
  'I see the text {string} in the {string}',
  async ({ page, world }, text: string, reference: string) => {
    const selector = world.resolve(reference);
    await expect(world.locator(page, selector)).toContainText(text);
  },
);

Then(
  '{int} elements of {string} are visible',
  async ({ page, world }, count: number, reference: string) => {
    const selector = world.resolve(reference);
    await expect(world.locator(page, selector).filter({ visible: true })).toHaveCount(count);
  },
);
