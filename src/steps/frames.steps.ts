import { When } from '../fixtures/world';

// ---------------------------------------------------------------------------
// iframe steps
//
// Supported step patterns:
//   When I switch to frame "iframe#my-frame"
//   When I switch to the main frame
//
// After switching to a frame, all subsequent element steps (click, fill, etc.)
// automatically operate inside that frame via world.locator() / world.getContext().
// Call "I switch to the main frame" to leave the frame context.
// ---------------------------------------------------------------------------

When('I switch to frame {string}', async ({ page, world }, reference: string) => {
  const selector = world.resolve(reference);
  world.setFrameLocator(world.getPage(page).frameLocator(selector));
});

When('I switch to the main frame', async ({ world }) => {
  world.setFrameLocator(null);
});
