import { expect } from '@playwright/test';
import { Then } from '../fixtures/world';

// ---------------------------------------------------------------------------
// Attribute & property assertion steps
//
// Supported step patterns:
//   Then I see the attribute "disabled" in element "button submit"
//   Then I not see the attribute "disabled" in element "button submit"
//   Then the attribute "href" of "link home" equals "/home"
//   Then the attribute "href" of "link home" contains "/home"
//   Then the value of "input email" equals "test@example.com"
//   Then the value of "input email" contains "example"
//   Then the value of "input email" is empty
//   Then the "input email" is disabled
//   Then the "input email" is enabled
//   Then the "input email" is checked
//   Then the "input email" is not checked
//   Then the "input email" is focused
//   Then the "input email" is editable
//   Then the "input email" is read-only
// ---------------------------------------------------------------------------

Then(
  'I see the attribute {string} in element {string}',
  async ({ page, world }, attribute: string, reference: string) => {
    const selector = world.resolve(reference);
    const value = await page.locator(selector).getAttribute(attribute);
    if (value === null) {
      throw new Error(
        `[playwright-bdd-steps] Expected attribute "${attribute}" to be present on "${reference}" but it was not found.`,
      );
    }
  },
);

Then(
  'I not see the attribute {string} in element {string}',
  async ({ page, world }, attribute: string, reference: string) => {
    const selector = world.resolve(reference);
    const value = await page.locator(selector).getAttribute(attribute);
    if (value !== null) {
      throw new Error(
        `[playwright-bdd-steps] Expected attribute "${attribute}" to NOT be present on "${reference}" but found value: "${value}".`,
      );
    }
  },
);

Then(
  'the attribute {string} of {string} equals {string}',
  async ({ page, world }, attribute: string, reference: string, expected: string) => {
    const selector = world.resolve(reference);
    await expect(page.locator(selector)).toHaveAttribute(attribute, expected);
  },
);

Then(
  'the attribute {string} of {string} contains {string}',
  async ({ page, world }, attribute: string, reference: string, expected: string) => {
    const selector = world.resolve(reference);
    const actual = await page.locator(selector).getAttribute(attribute);
    if (!actual?.includes(expected)) {
      throw new Error(
        `[playwright-bdd-steps] Expected attribute "${attribute}" to contain "${expected}" but got: "${actual}".`,
      );
    }
  },
);

Then(
  'the value of {string} equals {string}',
  async ({ page, world }, reference: string, expected: string) => {
    const selector = world.resolve(reference);
    await expect(page.locator(selector)).toHaveValue(expected);
  },
);

Then(
  'the value of {string} contains {string}',
  async ({ page, world }, reference: string, expected: string) => {
    const selector = world.resolve(reference);
    const actual = await page.locator(selector).inputValue();
    if (!actual.includes(expected)) {
      throw new Error(
        `[playwright-bdd-steps] Expected value to contain "${expected}" but got: "${actual}".`,
      );
    }
  },
);

Then('the value of {string} is empty', async ({ page, world }, reference: string) => {
  const selector = world.resolve(reference);
  await expect(page.locator(selector)).toHaveValue('');
});

Then('the {string} is disabled', async ({ page, world }, reference: string) => {
  const selector = world.resolve(reference);
  await expect(page.locator(selector)).toBeDisabled();
});

Then('the {string} is enabled', async ({ page, world }, reference: string) => {
  const selector = world.resolve(reference);
  await expect(page.locator(selector)).toBeEnabled();
});

Then('the {string} is checked', async ({ page, world }, reference: string) => {
  const selector = world.resolve(reference);
  await expect(page.locator(selector)).toBeChecked();
});

Then('the {string} is not checked', async ({ page, world }, reference: string) => {
  const selector = world.resolve(reference);
  await expect(page.locator(selector)).not.toBeChecked();
});

Then('the {string} is focused', async ({ page, world }, reference: string) => {
  const selector = world.resolve(reference);
  await expect(page.locator(selector)).toBeFocused();
});

Then('the {string} is editable', async ({ page, world }, reference: string) => {
  const selector = world.resolve(reference);
  await expect(page.locator(selector)).toBeEditable();
});

Then('the {string} is read-only', async ({ page, world }, reference: string) => {
  const selector = world.resolve(reference);
  await expect(page.locator(selector)).not.toBeEditable();
});
