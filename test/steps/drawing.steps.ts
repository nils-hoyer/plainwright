import { defineStep, type ElementRef } from '../../src/index';

// The example for canvases, maps and signature pads in docs/writing-steps.md.
defineStep({
  pattern: 'I draw a line across the {element}',
  description: 'Draws a line with the mouse from the left to the right of the element.',
  example: 'I draw a line across the "Signature" element',
  fn: async ({ world }, ref: ElementRef) => {
    await world.withElement(ref, async (element) => {
      const box = await element.boundingBox();
      if (!box) throw new Error(`The ${ref} is not visible.`);
      const y = box.y + box.height / 2;
      await world.page.mouse.move(box.x + 10, y);
      await world.page.mouse.down();
      await world.page.mouse.move(box.x + box.width - 10, y, { steps: 10 });
      await world.page.mouse.up();
    });
  },
});
