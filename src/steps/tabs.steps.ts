import { expect } from '@playwright/test';
import { findAlias } from '../elements';
import { category } from './builtin';

const step = category('Tabs and frames');

step({
  pattern: 'I switch to tab {number}',
  level: 'advanced',
  description: 'Continues in the browser tab at this position, counting from 1.',
  example: 'I switch to tab "2"',
  fn: async ({ world }, position: number) => {
    if (!Number.isInteger(position) || position < 1) {
      throw new Error(
        `[plainwright] There is no tab "${position}". Tabs are counted from 1: I switch to tab "1".`,
      );
    }
    const context = world.page.context();
    await expect
      .poll(() => context.pages().length, { message: `Expected tab ${position} to be open` })
      .toBeGreaterThanOrEqual(position);
    const tab = context.pages()[position - 1];
    world.switchToTab(tab);
    await tab.bringToFront();
    await tab.waitForLoadState();
  },
});

step({
  pattern: 'I open a new tab',
  level: 'advanced',
  description: 'Opens an empty browser tab and continues in it.',
  example: 'I open a new tab',
  fn: async ({ world }) => {
    world.switchToTab(await world.page.context().newPage());
  },
});

step({
  pattern: 'I close the current tab',
  level: 'advanced',
  description: 'Closes the current browser tab and continues in the last remaining one.',
  example: 'I close the current tab',
  fn: async ({ world }) => {
    const context = world.page.context();
    await world.page.close();
    const remaining = context.pages();
    if (remaining.length) world.switchToTab(remaining[remaining.length - 1]);
  },
});

step({
  pattern: 'I see {number} tab(s)',
  level: 'advanced',
  description: 'Checks how many browser tabs are open.',
  example: 'I see "2" tabs',
  fn: async ({ world }, count: number) => {
    const context = world.page.context();
    await expect
      .poll(() => context.pages().length, { message: `Expected ${count} open tab(s)` })
      .toBe(count);
  },
});

step({
  pattern: 'I switch to the {string} frame',
  level: 'advanced',
  description:
    'Continues inside the embedded frame (iframe) with this title or name, or with this alias.',
  example: 'I switch to the "Greeting" frame',
  fn: async ({ world }, name: string) => {
    const alias = findAlias(world.currentPage?.elements, { name, label: `"${name}" frame` });
    const scope = world.scope;
    const frame =
      alias === undefined
        ? scope
            .locator('iframe, frame')
            .and(scope.getByTitle(name, { exact: world.exactNames }))
            .or(scope.locator(`iframe[name=${JSON.stringify(name)}]`))
        : typeof alias === 'string'
          ? scope.locator(alias)
          : alias(scope);
    await expect(frame, `Expected a frame named "${name}"`).toBeAttached();
    world.switchToFrame(frame.contentFrame());
  },
});

step({
  pattern: 'I switch to the main frame',
  level: 'advanced',
  description: 'Leaves the embedded frame and continues on the page itself.',
  example: 'I switch to the main frame',
  fn: ({ world }) => {
    world.switchToFrame(null);
  },
});
