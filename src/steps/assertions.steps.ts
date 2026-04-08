import { expect } from '@playwright/test';
import { Then } from '../fixtures/world';

// ---------------------------------------------------------------------------
// Extended LocatorAssertions & PageAssertions steps
//
// Already covered elsewhere (not duplicated here):
//   toBeVisible / toBeHidden       → visibility.steps.ts
//   toBeDisabled / toBeEnabled     → attributes.steps.ts
//   toBeChecked / not.toBeChecked  → attributes.steps.ts
//   toBeFocused                    → attributes.steps.ts
//   toBeEditable / not.toBeEditable → attributes.steps.ts
//   toHaveAttribute                → attributes.steps.ts
//   toHaveValue                    → attributes.steps.ts
//   toHaveURL                      → navigation.steps.ts
//   toContainText (in element)     → visibility.steps.ts ("I see the text X in the Y")
//   toHaveCount (visible only)     → visibility.steps.ts ("{int} elements of X are visible")
//
// LocatorAssertions – new steps:
//   Then the {string} is attached to the DOM
//   Then the {string} is not attached to the DOM
//   Then the {string} is empty
//   Then the {string} is not empty
//   Then the {string} is in the viewport
//   Then the {string} is not in the viewport
//   Then the text of {string} is {string}
//   Then the text of {string} is not {string}
//   Then the {string} contains the text {string}
//   Then the {string} does not contain the text {string}
//   Then the {string} has the class {string}
//   Then the {string} does not have the class {string}
//   Then the {string} contains the class {string}
//   Then the {string} does not contain the class {string}
//   Then the {string} has {int} elements
//   Then the CSS property {string} of {string} equals {string}
//   Then the {string} has the ID {string}
//   Then the {string} has the role {string}
//   Then the {string} does not have the role {string}
//   Then the {string} has the accessible name {string}
//   Then the {string} does not have the accessible name {string}
//   Then the {string} has the accessible description {string}
//   Then the {string} does not have the accessible description {string}
//   Then the {string} has the accessible error message {string}
//   Then the {string} does not have the accessible error message {string}
//   Then the {string} has the JS property {string} with value {string}
//   Then the selected values of {string} include {string}
//   Then the {string} matches the screenshot {string}
//   Then the {string} matches the snapshot
//
// PageAssertions – new steps:
//   Then the page title is {string}
//   Then the page title is not {string}
//   Then the page title contains {string}
//   Then the page matches the screenshot {string}
//   Then the page matches the snapshot
// ---------------------------------------------------------------------------

// ─── toBeAttached ─────────────────────────────────────────────────────────────

Then('the {string} is attached to the DOM', async ({ page, world }, reference: string) => {
  const selector = world.resolve(reference);
  await expect(world.locator(page, selector)).toBeAttached();
});

Then('the {string} is not attached to the DOM', async ({ page, world }, reference: string) => {
  const selector = world.resolve(reference);
  await expect(world.locator(page, selector)).not.toBeAttached();
});

// ─── toBeEmpty ────────────────────────────────────────────────────────────────
// Note: "the value of X is empty" (for inputs) is in attributes.steps.ts.
// These steps check that any element (including non-input) has no text / is empty.

Then('the {string} is empty', async ({ page, world }, reference: string) => {
  const selector = world.resolve(reference);
  await expect(world.locator(page, selector)).toBeEmpty();
});

Then('the {string} is not empty', async ({ page, world }, reference: string) => {
  const selector = world.resolve(reference);
  await expect(world.locator(page, selector)).not.toBeEmpty();
});

// ─── toBeInViewport ───────────────────────────────────────────────────────────

Then('the {string} is in the viewport', async ({ page, world }, reference: string) => {
  const selector = world.resolve(reference);
  await expect(world.locator(page, selector)).toBeInViewport();
});

Then('the {string} is not in the viewport', async ({ page, world }, reference: string) => {
  const selector = world.resolve(reference);
  await expect(world.locator(page, selector)).not.toBeInViewport();
});

// ─── toHaveText / toContainText ───────────────────────────────────────────────
// "text of X is Y" → exact full-text match (toHaveText)
// "X contains the text Y" → substring match (toContainText)
// Note: "I see the text X in the Y" in visibility.steps.ts also uses toContainText,
// but uses a different sentence structure (text-first vs. element-first).

Then(
  'the text of {string} is {string}',
  async ({ page, world }, reference: string, expected: string) => {
    const selector = world.resolve(reference);
    await expect(world.locator(page, selector)).toHaveText(expected);
  },
);

Then(
  'the text of {string} is not {string}',
  async ({ page, world }, reference: string, expected: string) => {
    const selector = world.resolve(reference);
    await expect(world.locator(page, selector)).not.toHaveText(expected);
  },
);

Then(
  'the {string} contains the text {string}',
  async ({ page, world }, reference: string, expected: string) => {
    const selector = world.resolve(reference);
    await expect(world.locator(page, selector)).toContainText(expected);
  },
);

Then(
  'the {string} does not contain the text {string}',
  async ({ page, world }, reference: string, expected: string) => {
    const selector = world.resolve(reference);
    await expect(world.locator(page, selector)).not.toContainText(expected);
  },
);

// ─── toHaveClass / toContainClass ─────────────────────────────────────────────
// "has the class X" → toHaveClass – the full class attribute must match exactly
// "contains the class X" → toContainClass – element must have X among its classes

Then(
  'the {string} has the class {string}',
  async ({ page, world }, reference: string, expected: string) => {
    const selector = world.resolve(reference);
    await expect(world.locator(page, selector)).toHaveClass(expected);
  },
);

Then(
  'the {string} does not have the class {string}',
  async ({ page, world }, reference: string, expected: string) => {
    const selector = world.resolve(reference);
    await expect(world.locator(page, selector)).not.toHaveClass(expected);
  },
);

Then(
  'the {string} contains the class {string}',
  async ({ page, world }, reference: string, expected: string) => {
    const selector = world.resolve(reference);
    await expect(world.locator(page, selector)).toContainClass(expected);
  },
);

Then(
  'the {string} does not contain the class {string}',
  async ({ page, world }, reference: string, expected: string) => {
    const selector = world.resolve(reference);
    await expect(world.locator(page, selector)).not.toContainClass(expected);
  },
);

// ─── toHaveCount ──────────────────────────────────────────────────────────────
// Counts all matching DOM nodes (visible or not).
// Note: "{int} elements of X are visible" in visibility.steps.ts filters by visibility.

Then(
  'the {string} has {int} elements',
  async ({ page, world }, reference: string, count: number) => {
    const selector = world.resolve(reference);
    await expect(world.locator(page, selector)).toHaveCount(count);
  },
);

// ─── toHaveCSS ────────────────────────────────────────────────────────────────

Then(
  'the CSS property {string} of {string} equals {string}',
  async ({ page, world }, property: string, reference: string, value: string) => {
    const selector = world.resolve(reference);
    await expect(world.locator(page, selector)).toHaveCSS(property, value);
  },
);

// ─── toHaveId ─────────────────────────────────────────────────────────────────

Then(
  'the {string} has the ID {string}',
  async ({ page, world }, reference: string, id: string) => {
    const selector = world.resolve(reference);
    await expect(world.locator(page, selector)).toHaveId(id);
  },
);

// ─── toHaveRole ───────────────────────────────────────────────────────────────

Then(
  'the {string} has the role {string}',
  async ({ page, world }, reference: string, role: string) => {
    const selector = world.resolve(reference);
    // toHaveRole expects a specific ARIA role union type; cast needed for string parameter
    await expect(world.locator(page, selector)).toHaveRole(role as any);
  },
);

Then(
  'the {string} does not have the role {string}',
  async ({ page, world }, reference: string, role: string) => {
    const selector = world.resolve(reference);
    await expect(world.locator(page, selector)).not.toHaveRole(role as any);
  },
);

// ─── toHaveAccessibleName ─────────────────────────────────────────────────────

Then(
  'the {string} has the accessible name {string}',
  async ({ page, world }, reference: string, name: string) => {
    const selector = world.resolve(reference);
    await expect(world.locator(page, selector)).toHaveAccessibleName(name);
  },
);

Then(
  'the {string} does not have the accessible name {string}',
  async ({ page, world }, reference: string, name: string) => {
    const selector = world.resolve(reference);
    await expect(world.locator(page, selector)).not.toHaveAccessibleName(name);
  },
);

// ─── toHaveAccessibleDescription ─────────────────────────────────────────────

Then(
  'the {string} has the accessible description {string}',
  async ({ page, world }, reference: string, description: string) => {
    const selector = world.resolve(reference);
    await expect(world.locator(page, selector)).toHaveAccessibleDescription(description);
  },
);

Then(
  'the {string} does not have the accessible description {string}',
  async ({ page, world }, reference: string, description: string) => {
    const selector = world.resolve(reference);
    await expect(world.locator(page, selector)).not.toHaveAccessibleDescription(description);
  },
);

// ─── toHaveAccessibleErrorMessage ─────────────────────────────────────────────

Then(
  'the {string} has the accessible error message {string}',
  async ({ page, world }, reference: string, errorMessage: string) => {
    const selector = world.resolve(reference);
    await expect(world.locator(page, selector)).toHaveAccessibleErrorMessage(errorMessage);
  },
);

Then(
  'the {string} does not have the accessible error message {string}',
  async ({ page, world }, reference: string, errorMessage: string) => {
    const selector = world.resolve(reference);
    await expect(world.locator(page, selector)).not.toHaveAccessibleErrorMessage(errorMessage);
  },
);

// ─── toHaveJSProperty ─────────────────────────────────────────────────────────
// The value parameter is provided as a string and auto-cast:
//   "true" / "false" → boolean, numeric strings → number, everything else → string.

Then(
  'the {string} has the JS property {string} with value {string}',
  async ({ page, world }, reference: string, property: string, rawValue: string) => {
    const selector = world.resolve(reference);
    let value: unknown = rawValue;
    if (rawValue === 'true') value = true;
    else if (rawValue === 'false') value = false;
    else if (!isNaN(Number(rawValue)) && rawValue.trim() !== '') value = Number(rawValue);
    await expect(world.locator(page, selector)).toHaveJSProperty(property, value);
  },
);

// ─── toHaveValues (multi-select) ──────────────────────────────────────────────
// Values are provided as a comma-separated string, e.g. "Red, Green"

Then(
  'the selected values of {string} include {string}',
  async ({ page, world }, reference: string, valuesRaw: string) => {
    const selector = world.resolve(reference);
    const values = valuesRaw.split(',').map((v) => v.trim());
    await expect(world.locator(page, selector)).toHaveValues(values);
  },
);

// ─── toHaveScreenshot (visual regression, locator) ────────────────────────────

Then(
  'the {string} matches the screenshot {string}',
  async ({ page, world }, reference: string, name: string) => {
    const selector = world.resolve(reference);
    await expect(world.locator(page, selector)).toHaveScreenshot(name);
  },
);

Then('the {string} matches the snapshot', async ({ page, world }, reference: string) => {
  const selector = world.resolve(reference);
  await expect(world.locator(page, selector)).toHaveScreenshot();
});

// ─── PageAssertions ───────────────────────────────────────────────────────────

Then(
  'the page title equals {string}',
  async ({ page, world }, expected: string) => {
    await expect(world.getPage(page)).toHaveTitle(expected);
  },
);

Then(
  'the page title is not {string}',
  async ({ page, world }, expected: string) => {
    await expect(world.getPage(page)).not.toHaveTitle(expected);
  },
);

Then(
  'the page title contains {string}',
  async ({ page, world }, substring: string) => {
    const escapedPattern = substring.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    await expect(world.getPage(page)).toHaveTitle(new RegExp(escapedPattern));
  },
);

// ─── toHaveScreenshot (visual regression, page) ───────────────────────────────

Then(
  'the page matches the screenshot {string}',
  async ({ page, world }, name: string) => {
    await expect(world.getPage(page)).toHaveScreenshot(name);
  },
);

Then('the page matches the snapshot', async ({ page, world }) => {
  await expect(world.getPage(page)).toHaveScreenshot();
});
