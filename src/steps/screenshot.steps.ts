import { When } from '../fixtures/world';

// ---------------------------------------------------------------------------
// Screenshot steps
//
// Supported step patterns:
//   When I take a screenshot
//   When I take a screenshot named "my-screenshot"
//   When I take a screenshot of "header banner"
// ---------------------------------------------------------------------------

When('I take a screenshot', async ({ page }) => {
  await page.screenshot({ path: `test-results/screenshot-${Date.now()}.png`, fullPage: false });
});

When('I take a screenshot named {string}', async ({ page }, name: string) => {
  const safeName = name.replace(/[^a-zA-Z0-9-_]/g, '_');
  await page.screenshot({ path: `test-results/${safeName}.png`, fullPage: false });
});

When('I take a screenshot of {string}', async ({ page, world }, reference: string) => {
  const selector = world.resolve(reference);
  const safeName = reference.replace(/[^a-zA-Z0-9-_]/g, '_');
  await page.locator(selector).screenshot({ path: `test-results/${safeName}-${Date.now()}.png` });
});
