import { expect } from '@playwright/test';
import type { ElementRef } from '../elements';
import { category } from './builtin';

const step = category('Waiting');

// Every "I see" step already waits. Fixed waits make tests slow and still flaky.
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
  pattern: 'I wait {number} millisecond(s)',
  level: 'advanced',
  description: 'Pauses the test for this many milliseconds.',
  example: 'I wait "500" milliseconds',
  discouraged: FIXED_WAIT,
  fn: async ({ world }, milliseconds: number) => {
    await world.page.waitForTimeout(milliseconds);
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

step({
  pattern: 'I wait for the page to load',
  level: 'advanced',
  description: 'Waits until the browser reports that the page and its images have loaded.',
  example: 'I wait for the page to load',
  fn: async ({ world }) => {
    await world.page.waitForLoadState('load');
  },
});

step({
  pattern: 'I wait for network idle',
  level: 'advanced',
  description: 'Waits until the page has made no network requests for half a second.',
  example: 'I wait for network idle',
  discouraged:
    'Network idle is unreliable for pages that poll or stream. Check for what the user waits for instead.',
  fn: async ({ world }) => {
    await world.page.waitForLoadState('networkidle');
  },
});
