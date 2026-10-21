import { expect, test } from '@playwright/test';
import type { ElementRef } from '../elements';
import { category } from './builtin';

const step = category('Screenshots');

step({
  pattern: 'I take a screenshot',
  level: 'advanced',
  description: 'Adds a screenshot of the visible page to the test report.',
  example: 'I take a screenshot',
  fn: async ({ world }) => {
    const body = await world.page.screenshot();
    await test.info().attach('screenshot', { body, contentType: 'image/png' });
  },
});

step({
  pattern: 'I take a screenshot named {string}',
  level: 'advanced',
  description: 'Adds a screenshot of the visible page to the test report under this name.',
  example: 'I take a screenshot named "Login form"',
  fn: async ({ world }, name: string) => {
    const body = await world.page.screenshot();
    await test.info().attach(name, { body, contentType: 'image/png' });
  },
});

step({
  pattern: 'I take a screenshot of the {element}',
  level: 'advanced',
  description: 'Adds a screenshot of just this element to the test report.',
  example: 'I take a screenshot of the "Account Overview" section',
  fn: async ({ world }, element: ElementRef) => {
    const body = await world.withElement(element, (el) => el.screenshot());
    await test.info().attach(String(element), { body, contentType: 'image/png' });
  },
});

step({
  pattern: 'I see the {element} matches the screenshot {string}',
  level: 'advanced',
  description:
    'Compares the element with the stored screenshot of this name. Without one, it stores one next to the feature file and fails once.',
  example: 'I see the "Blue square" section matches the screenshot "blue-square.png"',
  fn: async ({ world }, element: ElementRef, name: string) => {
    await world.withElement(element, (el) => expect(el).toHaveScreenshot(name));
  },
});

step({
  pattern: 'I see the page matches the screenshot {string}',
  level: 'advanced',
  description:
    'Compares the visible page with the stored screenshot of this name. Without one, it stores one next to the feature file and fails once.',
  example: 'I see the page matches the screenshot "swatch-page.png"',
  fn: async ({ world }, name: string) => {
    await expect(world.page).toHaveScreenshot(name);
  },
});
