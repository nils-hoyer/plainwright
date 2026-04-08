import { When } from '../fixtures/world';

// ---------------------------------------------------------------------------
// Touchscreen steps
//
// NOTE: these steps require the browser context to have hasTouch set to true.
// Add a Playwright project with `hasTouch: true` in playwright.config.ts and
// tag touchscreen scenarios with @touch so they run in the correct project.
//
// Supported step patterns:
//   When I tap at 200 300
//   When I tap on "tap target"
// ---------------------------------------------------------------------------

When('I tap at {int} {int}', async ({ page, world }, x: number, y: number) => {
  await world.getPage(page).touchscreen.tap(x, y);
});

When('I tap on {string}', async ({ page, world }, reference: string) => {
  const selector = world.resolve(reference);
  const locator = world.locator(page, selector);
  const box = await locator.boundingBox();
  if (!box) {
    throw new Error(
      `[playwright-bdd-steps] Element "${reference}" has no bounding box – is it visible?`,
    );
  }
  const x = Math.round(box.x + box.width / 2);
  const y = Math.round(box.y + box.height / 2);
  await world.getPage(page).touchscreen.tap(x, y);
});
