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
    await expect(world.locator(page, selector)).toHaveAttribute(attribute);
  },
);

Then(
  'I not see the attribute {string} in element {string}',
  async ({ page, world }, attribute: string, reference: string) => {
    const selector = world.resolve(reference);
    await expect(world.locator(page, selector)).not.toHaveAttribute(attribute);
  },
);

Then(
  'the attribute {string} of {string} equals {string}',
  async ({ page, world }, attribute: string, reference: string, expected: string) => {
    const selector = world.resolve(reference);
    await expect(world.locator(page, selector)).toHaveAttribute(attribute, expected);
  },
);

Then(
  'the attribute {string} of {string} contains {string}',
  async ({ page, world }, attribute: string, reference: string, expected: string) => {
    const selector = world.resolve(reference);
    const escapedPattern = expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    await expect(world.locator(page, selector)).toHaveAttribute(attribute, new RegExp(escapedPattern));
  },
);

Then(
  'the value of {string} equals {string}',
  async ({ page, world }, reference: string, expected: string) => {
    const selector = world.resolve(reference);
    await expect(world.locator(page, selector)).toHaveValue(expected);
  },
);

Then(
  'the value of {string} contains {string}',
  async ({ page, world }, reference: string, expected: string) => {
    const selector = world.resolve(reference);
    const escapedPattern = expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    await expect(world.locator(page, selector)).toHaveValue(new RegExp(escapedPattern));
  },
);

Then('the value of {string} is empty', async ({ page, world }, reference: string) => {
  const selector = world.resolve(reference);
  await expect(world.locator(page, selector)).toHaveValue('');
});

Then('the {string} is disabled', async ({ page, world }, reference: string) => {
  const selector = world.resolve(reference);
  await expect(world.locator(page, selector)).toBeDisabled();
});

Then('the {string} is enabled', async ({ page, world }, reference: string) => {
  const selector = world.resolve(reference);
  await expect(world.locator(page, selector)).toBeEnabled();
});

Then('the {string} is checked', async ({ page, world }, reference: string) => {
  const selector = world.resolve(reference);
  await expect(world.locator(page, selector)).toBeChecked();
});

Then('the {string} is not checked', async ({ page, world }, reference: string) => {
  const selector = world.resolve(reference);
  await expect(world.locator(page, selector)).not.toBeChecked();
});

Then('the {string} is focused', async ({ page, world }, reference: string) => {
  const selector = world.resolve(reference);
  await expect(world.locator(page, selector)).toBeFocused();
});

Then('the {string} is editable', async ({ page, world }, reference: string) => {
  const selector = world.resolve(reference);
  await expect(world.locator(page, selector)).toBeEditable();
});

Then('the {string} is read-only', async ({ page, world }, reference: string) => {
  const selector = world.resolve(reference);
  await expect(world.locator(page, selector)).not.toBeEditable();
});
