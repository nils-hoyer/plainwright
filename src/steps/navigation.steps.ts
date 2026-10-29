import { expect } from '@playwright/test';
import { isUrlPattern } from '../pages';
import { category, escapeRegExp } from './builtin';

const step = category('Pages and navigation');

step({
  pattern: 'I open the {string} page',
  level: 'core',
  description:
    'Opens the address of the page defined with this name and uses the element names defined for it.',
  example: 'I open the "Login" page',
  fn: async ({ world }, name: string) => {
    const page = world.usePage(name);
    if (typeof page.url !== 'string' || isUrlPattern(page.url)) {
      throw new Error(
        page.url
          ? `[plainwright] The page "${name}" has the address pattern ${page.url}, which cannot ` +
              `be opened. Open the address with I open the url "/...", then I am on the "${name}" page.`
          : `[plainwright] The page "${name}" has no address to open. Add its "url".`,
      );
    }
    await world.page.goto(page.url as string);
  },
});

step({
  pattern: 'I am on the {string} page',
  level: 'core',
  description:
    'Uses the element names defined for this page from here on, such as after a click that leads to it. Checks nothing: to check the address, add I see the url "…".',
  example: 'I am on the "Dashboard" page',
  fn: ({ world }, name: string) => {
    world.usePage(name);
  },
});

step({
  pattern: 'I open the url {string}',
  level: 'core',
  description:
    'Opens a web address, absolute or relative to the base URL. The current page stays: to use the element names of another page, add I am on the "…" page.',
  example: 'I open the url "/login"',
  fn: async ({ world }, url: string) => {
    world.leaveFrame();
    await world.page.goto(url);
  },
});

step({
  pattern: 'I go back',
  level: 'core',
  description: 'Goes back to the previous page, like the browser back button.',
  example: 'I go back',
  fn: async ({ world }) => {
    await world.page.goBack();
  },
});

step({
  pattern: 'I go forward',
  level: 'advanced',
  description: 'Goes forward to the next page, like the browser forward button.',
  example: 'I go forward',
  fn: async ({ world }) => {
    await world.page.goForward();
  },
});

step({
  pattern: 'I reload the page',
  level: 'core',
  description: 'Reloads the current page.',
  example: 'I reload the page',
  fn: async ({ world }) => {
    await world.page.reload();
  },
});

step({
  pattern: 'I see the url {string}',
  level: 'core',
  description: 'Checks that the address is exactly this URL (relative URLs use the base URL).',
  example: 'I see the url "/dashboard"',
  fn: async ({ world }, url: string) => {
    await expect(world.page).toHaveURL(world.url(url));
  },
});

step({
  pattern: 'I see the url containing {string}',
  level: 'advanced',
  description: 'Checks that the address contains this text.',
  example: 'I see the url containing "dashboard"',
  fn: async ({ world }, text: string) => {
    await expect(world.page).toHaveURL(new RegExp(escapeRegExp(text)));
  },
});

step({
  pattern: 'I do not see the url containing {string}',
  level: 'advanced',
  description: 'Checks that the address does not contain this text.',
  example: 'I do not see the url containing "login"',
  fn: async ({ world }, text: string) => {
    await expect(world.page).not.toHaveURL(new RegExp(escapeRegExp(text)));
  },
});

step({
  pattern: 'I see the page title {string}',
  level: 'advanced',
  description: 'Checks that the title of the browser tab is exactly this text.',
  example: 'I see the page title "Login"',
  fn: async ({ world }, title: string) => {
    await expect(world.page).toHaveTitle(title);
  },
});

step({
  pattern: 'I see the page title containing {string}',
  level: 'advanced',
  description: 'Checks that the title of the browser tab contains this text.',
  example: 'I see the page title containing "Log"',
  fn: async ({ world }, text: string) => {
    await expect(world.page).toHaveTitle(new RegExp(escapeRegExp(text)));
  },
});
