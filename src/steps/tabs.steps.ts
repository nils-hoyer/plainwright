import { expect } from '@playwright/test';
import { When, Then } from '../fixtures/world';

// ---------------------------------------------------------------------------
// Browser tab & window steps
//
// Supported step patterns:
//   When I open a new tab
//   When I switch to tab {int}
//   When I close the current tab
//   Then {int} tabs are open
//
// After "I switch to tab N" all subsequent steps (navigation, click, fill, etc.)
// automatically target that tab via world.getPage() / world.locator().
// ---------------------------------------------------------------------------

When('I open a new tab', async ({ page }) => {
  await page.context().newPage();
});

When('I switch to tab {int}', async ({ page, world }, tabNumber: number) => {
  const pages = page.context().pages();
  const index = tabNumber - 1;
  if (index < 0 || index >= pages.length) {
    throw new Error(
      `[playwright-bdd-steps] Cannot switch to tab ${tabNumber}: only ${pages.length} tab(s) open.`,
    );
  }
  world.setActivePage(pages[index]);
  await pages[index].bringToFront();
});

When('I close the current tab', async ({ page, world }) => {
  const currentPage = world.getPage(page);
  await currentPage.close();
  // If we closed a non-primary tab, reset back to the fixture page
  if (currentPage !== page) {
    world.setActivePage(page);
  }
});

Then('{int} tabs are open', async ({ page }, count: number) => {
  // expect.poll() retries until the condition is met (or timeout), important
  // because a new tab may not be registered in the context immediately.
  await expect.poll(() => page.context().pages().length, {
    message: `Expected ${count} tab(s) to be open`,
  }).toBe(count);
});
