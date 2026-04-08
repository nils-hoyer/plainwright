import { When } from '../fixtures/world';

// ---------------------------------------------------------------------------
// Mouse steps
//
// All coordinates are in main-frame CSS pixels relative to the top-left
// corner of the viewport.
//
// Supported step patterns:
//   When I click at position {int} {int}
//   When I double click at position {int} {int}
//   When I right click at position {int} {int}
//   When I move the mouse to {int} {int}
//   When I press the mouse button
//   When I press the {string} mouse button
//   When I release the mouse button
//   When I scroll the mouse wheel by {int} and {int}
// ---------------------------------------------------------------------------

When('I click at position {int} {int}', async ({ page, world }, x: number, y: number) => {
  await world.getPage(page).mouse.click(x, y);
});

When(
  'I double click at position {int} {int}',
  async ({ page, world }, x: number, y: number) => {
    await world.getPage(page).mouse.dblclick(x, y);
  },
);

When(
  'I right click at position {int} {int}',
  async ({ page, world }, x: number, y: number) => {
    await world.getPage(page).mouse.click(x, y, { button: 'right' });
  },
);

When('I move the mouse to {int} {int}', async ({ page, world }, x: number, y: number) => {
  await world.getPage(page).mouse.move(x, y);
});

When('I press the mouse button', async ({ page, world }) => {
  await world.getPage(page).mouse.down();
});

When('I press the {string} mouse button', async ({ page, world }, button: string) => {
  if (button !== 'left' && button !== 'right' && button !== 'middle') {
    throw new Error(
      `[playwright-bdd-steps] Invalid mouse button "${button}". Use "left", "right", or "middle".`,
    );
  }
  await world.getPage(page).mouse.down({ button });
});

When('I release the mouse button', async ({ page, world }) => {
  await world.getPage(page).mouse.up();
});

When(
  'I scroll the mouse wheel by {int} and {int}',
  async ({ page, world }, deltaX: number, deltaY: number) => {
    await world.getPage(page).mouse.wheel(deltaX, deltaY);
  },
);
