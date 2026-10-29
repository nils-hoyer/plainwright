import { expect } from '@playwright/test';
import type { ElementRef } from '../elements';
import { category } from './builtin';

const step = category('Waiting');

// Every "I see" step already waits, up to the expect timeout. A fixed wait makes tests slow and
// still flaky; it stays as a fallback, and lint warns about it. Plainwright leaves out other
// waits (src/left-out.ts).
const FIXED_WAIT =
  'Fixed waits slow tests down and still break on slow days. Check for what the user waits for instead, e.g. I see the text "...".';

step({
  pattern: 'I wait {number} second(s)',
  level: 'advanced',
  description: 'Pauses the test for this many seconds.',
  example: 'I wait "2" seconds',
  discouraged: FIXED_WAIT,
  fn: async ({ world }, seconds: number) => {
    await world.page.waitForTimeout(seconds * 1000);
  },
});

step({
  pattern: 'I see the {element} within {number} second(s)',
  level: 'advanced',
  description: 'Checks that the element becomes visible, waiting up to this many seconds.',
  example: 'I see the "Report ready" heading within "30" seconds',
  fn: async ({ world }, element: ElementRef, seconds: number) => {
    await world.withElement(element, (el) => expect(el).toBeVisible({ timeout: seconds * 1000 }));
  },
});
