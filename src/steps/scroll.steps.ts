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

When('I scroll to the bottom of the page', async ({ page, world }) => {
  await world.getPage(page).evaluate(() => window.scrollTo(0, document.body.scrollHeight));
});

When('I scroll to the top of the page', async ({ page, world }) => {
  await world.getPage(page).evaluate(() => window.scrollTo(0, 0));
});

When('I scroll to {string}', async ({ page, world }, reference: string) => {
  const selector = world.resolve(reference);
  await world.locator(page, selector).scrollIntoViewIfNeeded();
});

When('I scroll {string} by {int} pixels', async ({ page, world }, direction: string, pixels: number) => {
  const lower = direction.toLowerCase();
  if (lower !== 'up' && lower !== 'down') {
    throw new Error(
      `[playwright-bdd-steps] Invalid scroll direction "${direction}". Use "up" or "down".`,
    );
  }
  const dy = lower === 'down' ? pixels : -pixels;
  await world.getPage(page).evaluate((offset) => window.scrollBy(0, offset), dy);
});
