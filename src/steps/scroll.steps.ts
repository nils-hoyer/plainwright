import type { ElementRef } from '../elements';
import { category } from './builtin';

const step = category('Scrolling');

// Clicking and checking scroll automatically. These steps are for pages that react to scrolling.

step({
  pattern: 'I scroll to the {element}',
  level: 'advanced',
  description: 'Scrolls until the element is in view.',
  example: 'I scroll to the "You scrolled all the way down!" element',
  fn: async ({ world }, element: ElementRef) => {
    await world.withElement(element, (el) => el.scrollIntoViewIfNeeded());
  },
});

step({
  pattern: 'I scroll to the bottom of the page',
  level: 'advanced',
  description: 'Scrolls to the end of the page.',
  example: 'I scroll to the bottom of the page',
  fn: async ({ world }) => {
    await world.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  },
});

step({
  pattern: 'I scroll to the top of the page',
  level: 'advanced',
  description: 'Scrolls to the start of the page.',
  example: 'I scroll to the top of the page',
  fn: async ({ world }) => {
    await world.page.evaluate(() => window.scrollTo(0, 0));
  },
});

step({
  pattern: 'I scroll down by {number} pixels',
  level: 'advanced',
  description: 'Scrolls the page down by this many pixels.',
  example: 'I scroll down by "500" pixels',
  fn: async ({ world }, pixels: number) => {
    await world.page.evaluate((dy) => window.scrollBy(0, dy), pixels);
  },
});

step({
  pattern: 'I scroll up by {number} pixels',
  level: 'advanced',
  description: 'Scrolls the page up by this many pixels.',
  example: 'I scroll up by "200" pixels',
  fn: async ({ world }, pixels: number) => {
    await world.page.evaluate((dy) => window.scrollBy(0, -dy), pixels);
  },
});
