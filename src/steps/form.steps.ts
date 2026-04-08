import { When } from '../fixtures/world';

// ---------------------------------------------------------------------------
// Form interaction steps
//
// Supported step patterns:
//   When I fill "hello@example.com" in the "input email"
//   When I type "hello" in the "input username"          ← alias for fill
//   When I clear the "input search"
//   When I clear and fill "new value" in the "input name"
//   When I check the "checkbox terms"
//   When I uncheck the "checkbox newsletter"
//   When I select "Option A" in the "select country"
//   When I select the option at index 2 in the "select size"
//   When I upload the file "/path/to/file.png" to "input file"
//   When I press "Enter"
//   When I press "Tab" on "input email"
// ---------------------------------------------------------------------------

When(
  'I fill {string} in the {string}',
  async ({ page, world }, text: string, reference: string) => {
    const selector = world.resolve(reference);
    await world.locator(page, selector).fill(text);
  },
);

// "type" is an alias that behaves the same as "fill" (clear + type)
When(
  'I type {string} in the {string}',
  async ({ page, world }, text: string, reference: string) => {
    const selector = world.resolve(reference);
    await world.locator(page, selector).fill(text);
  },
);

When('I clear the {string}', async ({ page, world }, reference: string) => {
  const selector = world.resolve(reference);
  await world.locator(page, selector).clear();
});

When(
  'I clear and fill {string} in the {string}',
  async ({ page, world }, text: string, reference: string) => {
    const selector = world.resolve(reference);
    // fill() clears the field internally before typing, but this step exists
    // as an explicit two-phase alternative that also fires a separate 'input' event
    // on clear — useful for fields that react to explicit clearing.
    const locator = world.locator(page, selector);
    await locator.clear();
    await locator.fill(text);
  },
);

When('I check the {string}', async ({ page, world }, reference: string) => {
  const selector = world.resolve(reference);
  await world.locator(page, selector).check();
});

When('I uncheck the {string}', async ({ page, world }, reference: string) => {
  const selector = world.resolve(reference);
  await world.locator(page, selector).uncheck();
});

When(
  'I select {string} in the {string}',
  async ({ page, world }, option: string, reference: string) => {
    const selector = world.resolve(reference);
    await world.locator(page, selector).selectOption({ label: option });
  },
);

When(
  'I select the option at index {int} in the {string}',
  async ({ page, world }, index: number, reference: string) => {
    const selector = world.resolve(reference);
    await world.locator(page, selector).selectOption({ index });
  },
);

When(
  'I upload the file {string} to {string}',
  async ({ page, world }, filePath: string, reference: string) => {
    const selector = world.resolve(reference);
    await world.locator(page, selector).setInputFiles(filePath);
  },
);

When('I press {string}', async ({ page, world }, key: string) => {
  await world.getPage(page).keyboard.press(key);
});

When('I press {string} on {string}', async ({ page, world }, key: string, reference: string) => {
  const selector = world.resolve(reference);
  await world.locator(page, selector).press(key);
});
