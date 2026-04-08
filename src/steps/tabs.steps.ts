import { When, Then } from '../fixtures/world';

// ---------------------------------------------------------------------------
// Browser tab & window steps
//
// Supported step patterns:
//   When I open a new tab
//   When I switch to tab {int}
//   When I close the current tab
//   Then {int} tabs are open
// ---------------------------------------------------------------------------

When('I open a new tab', async ({ page }) => {
  await page.context().newPage();
});

When('I switch to tab {int}', async ({ page }, tabNumber: number) => {
  const pages = page.context().pages();
  const index = tabNumber - 1;
  if (index < 0 || index >= pages.length) {
    throw new Error(
      `[playwright-bdd-steps] Cannot switch to tab ${tabNumber}: only ${pages.length} tab(s) open.`,
    );
  }
  await pages[index].bringToFront();
});

When('I close the current tab', async ({ page }) => {
  await page.close();
});

Then('{int} tabs are open', async ({ page }, count: number) => {
  const actual = page.context().pages().length;
  if (actual !== count) {
    throw new Error(
      `[playwright-bdd-steps] Expected ${count} tab(s) to be open but found ${actual}.`,
    );
  }
});
