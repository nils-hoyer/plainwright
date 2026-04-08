import { When } from '../fixtures/world';

// ---------------------------------------------------------------------------
// Drag and Drop steps
//
// Uses Locator.dragTo() which dispatches mouse events (mousedown → mousemove
// → mouseup) to simulate a drag operation. Works with both CSS-based and
// mouse-event-based custom drag implementations.
//
// Supported step patterns:
//   When I drag "drag source" to "drop target"
// ---------------------------------------------------------------------------

When(
  'I drag {string} to {string}',
  async ({ page, world }, sourceRef: string, targetRef: string) => {
    const sourceSelector = world.resolve(sourceRef);
    const targetSelector = world.resolve(targetRef);
    await world
      .locator(page, sourceSelector)
      .dragTo(world.locator(page, targetSelector));
  },
);
