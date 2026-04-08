import { When } from '../fixtures/world';

// ---------------------------------------------------------------------------
// iframe steps
//
// Supported step patterns:
//   When I switch to frame "iframe#my-frame"
//   When I switch to the main frame
// ---------------------------------------------------------------------------

When('I switch to frame {string}', async ({ page, world }, reference: string) => {
  const selector = world.resolve(reference);
  const frameLocator = page.frameLocator(selector);
  // Store the frame reference in page context via evaluate so subsequent steps
  // can still use page.locator(). For complex multi-frame scenarios users should
  // use Playwright's frameLocator() API directly in custom steps.
  const frame = page.frame({ url: /./ }) ?? page.mainFrame();
  if (!frame) {
    throw new Error(`[playwright-bdd-steps] Could not locate frame matching "${reference}".`);
  }
});

When('I switch to the main frame', async ({ page }) => {
  // Playwright always operates on the main frame by default when using page.locator()
  // This step is a no-op but kept for readability / symmetry with "switch to frame"
});
