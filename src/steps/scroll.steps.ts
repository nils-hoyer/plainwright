import { When } from '../fixtures/world';

// ---------------------------------------------------------------------------
// Scroll & viewport steps
//
// Supported step patterns:
//   When I scroll to the bottom of the page
//   When I scroll to the top of the page
//   When I scroll to "section results"
//   When I scroll "down" by 500 pixels
//   When I scroll "up" by 200 pixels
// ---------------------------------------------------------------------------

When('I scroll to the bottom of the page', async ({ page }) => {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
});

When('I scroll to the top of the page', async ({ page }) => {
  await page.evaluate(() => window.scrollTo(0, 0));
});

When('I scroll to {string}', async ({ page, world }, reference: string) => {
  const selector = world.resolve(reference);
  await page.locator(selector).scrollIntoViewIfNeeded();
});

When('I scroll {string} by {int} pixels', async ({ page }, direction: string, pixels: number) => {
  const dy = direction.toLowerCase() === 'down' ? pixels : -pixels;
  await page.evaluate((offset) => window.scrollBy(0, offset), dy);
});
