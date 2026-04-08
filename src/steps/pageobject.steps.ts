import { Given } from '../fixtures/world';

// ---------------------------------------------------------------------------
// Page Object management steps
//
// Supported step patterns:
//   Given I use the page object "login"
//   When I use the page object "dashboard"
// ---------------------------------------------------------------------------

Given('I use the page object {string}', async ({ world }, name: string) => {
  world.usePageObject(name);
});
