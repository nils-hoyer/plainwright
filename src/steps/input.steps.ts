import type { ElementRef } from '../elements';
import { category } from './builtin';

const step = category('Keyboard, mouse and touch');

// Low-level input. Prefer the steps in "Clicking and typing", which name elements.

step({
  pattern: 'I type {string} on the keyboard',
  level: 'advanced',
  description:
    'Types the text key by key into the focused element, without clearing it first. To replace a field value, use I fill.',
  example: 'I type "Hello" on the keyboard',
  fn: async ({ world }, text: string) => {
    await world.page.keyboard.type(text);
  },
});

step({
  pattern: 'I hold down the key {string}',
  level: 'advanced',
  description: 'Presses the key and keeps it pressed until I release the key.',
  example: 'I hold down the key "Shift"',
  fn: async ({ world }, key: string) => {
    await world.page.keyboard.down(key);
  },
});

step({
  pattern: 'I release the key {string}',
  level: 'advanced',
  description: 'Releases a key that was held down.',
  example: 'I release the key "Shift"',
  fn: async ({ world }, key: string) => {
    await world.page.keyboard.up(key);
  },
});

step({
  pattern: 'I insert the text {string}',
  level: 'advanced',
  description:
    'Inserts the text into the focused element at once, without key presses (like pasting).',
  example: 'I insert the text "嗨"',
  fn: async ({ world }, text: string) => {
    await world.page.keyboard.insertText(text);
  },
});

step({
  pattern: 'I click at x {number} y {number}',
  level: 'advanced',
  description: 'Clicks at this position, in pixels from the top left corner of the page view.',
  example: 'I click at x "200" y "150"',
  fn: async ({ world }, x: number, y: number) => {
    await world.page.mouse.click(x, y);
  },
});

step({
  pattern: 'I double click at x {number} y {number}',
  level: 'advanced',
  description:
    'Double-clicks at this position, in pixels from the top left corner of the page view.',
  example: 'I double click at x "200" y "150"',
  fn: async ({ world }, x: number, y: number) => {
    await world.page.mouse.dblclick(x, y);
  },
});

step({
  pattern: 'I right click at x {number} y {number}',
  level: 'advanced',
  description:
    'Right-clicks at this position, in pixels from the top left corner of the page view.',
  example: 'I right click at x "200" y "150"',
  fn: async ({ world }, x: number, y: number) => {
    await world.page.mouse.click(x, y, { button: 'right' });
  },
});

step({
  pattern: 'I move the mouse to x {number} y {number}',
  level: 'advanced',
  description:
    'Moves the mouse to this position, in pixels from the top left corner of the page view.',
  example: 'I move the mouse to x "200" y "150"',
  fn: async ({ world }, x: number, y: number) => {
    await world.page.mouse.move(x, y);
  },
});

step({
  pattern: 'I press the mouse button',
  level: 'advanced',
  description:
    'Presses the left mouse button and keeps it pressed until I release the mouse button.',
  example: 'I press the mouse button',
  fn: async ({ world }) => {
    await world.page.mouse.down();
  },
});

step({
  pattern: 'I press the {string} mouse button',
  level: 'advanced',
  description: 'Presses the "left", "right" or "middle" mouse button and keeps it pressed.',
  example: 'I press the "left" mouse button',
  fn: async ({ world }, button: string) => {
    if (button !== 'left' && button !== 'right' && button !== 'middle') {
      throw new Error(
        `[plainwright] Unknown mouse button "${button}". Use "left", "right" or "middle".`,
      );
    }
    await world.page.mouse.down({ button });
  },
});

step({
  pattern: 'I release the mouse button',
  level: 'advanced',
  description: 'Releases the mouse button that was pressed.',
  example: 'I release the mouse button',
  fn: async ({ world }) => {
    await world.page.mouse.up();
  },
});

step({
  pattern: 'I scroll the mouse wheel by x {number} y {number}',
  level: 'advanced',
  description: 'Turns the mouse wheel by this many pixels sideways (x) and down (y).',
  example: 'I scroll the mouse wheel by x "0" y "100"',
  fn: async ({ world }, x: number, y: number) => {
    await world.page.mouse.wheel(x, y);
  },
});

step({
  pattern: 'I tap the {element}',
  level: 'advanced',
  description: 'Taps the element on a touch screen. Needs a browser with touch enabled (hasTouch).',
  example: 'I tap the "Tap me" button',
  fn: async ({ world }, element: ElementRef) => {
    await world.withElement(element, (el) => el.tap());
  },
});

step({
  pattern: 'I tap at x {number} y {number}',
  level: 'advanced',
  description:
    'Taps at this position on a touch screen. Needs a browser with touch enabled (hasTouch).',
  example: 'I tap at x "300" y "200"',
  fn: async ({ world }, x: number, y: number) => {
    await world.page.touchscreen.tap(x, y);
  },
});
