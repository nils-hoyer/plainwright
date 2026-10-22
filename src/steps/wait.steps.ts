import { expect } from '@playwright/test';
import type { ElementRef } from '../elements';
import { category } from './builtin';

const step = category('Waiting');

// Every "I see" step already waits, up to the expect timeout. There are no fixed waits: they
// make tests slow and still flaky (removed in 0.3.0, see src/removed.ts).

step({
  pattern: 'I see the {element} within {number} second(s)',
  level: 'advanced',
  description: 'Checks that the element becomes visible, waiting up to this many seconds.',
  example: 'I see the "Report ready" heading within "30" seconds',
  fn: async ({ world }, element: ElementRef, seconds: number) => {
    await world.withElement(element, (el) => expect(el).toBeVisible({ timeout: seconds * 1000 }));
  },
});
