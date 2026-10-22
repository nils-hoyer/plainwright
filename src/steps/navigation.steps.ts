import { expect } from '@playwright/test';
import { addressPattern, getPageDefinition, isUrlPattern } from '../pages';
import { category, escapeRegExp } from './builtin';

const step = category('Pages and navigation');

step({
  pattern: 'I open the {string} page',
  level: 'core',
  description: 'Opens the address of the page defined with this name.',
  example: 'I open the "Login" page',
  fn: async ({ world }, name: string) => {
    const page = getPageDefinition(name);
    if (typeof page.url !== 'string' || isUrlPattern(page.url)) {
      throw new Error(
        page.url
          ? `[plainwright] The page "${name}" has the address pattern ${page.url}, which can only ` +
              `be checked (I am on the "${name}" page). Open it with I open the url "/...".`
          : `[plainwright] The page "${name}" has no address to open. Add its "url".`,
      );
    }
    await world.page.goto(page.url);
  },
});

step({
  pattern: 'I am on the {string} page',
  level: 'core',
  description: 'Checks that the browser shows the address of this page, waiting until it does.',
  example: 'I am on the "Dashboard" page',
  fn: async ({ world }, name: string) => {
    const page = getPageDefinition(name);
    if (!page.url) {
      throw new Error(`[plainwright] The page "${name}" has no address to check. Add its "url".`);
    }
    await expect(world.page, `Expected to be on the "${name}" page`).toHaveURL(
      addressPattern(page.url, (path) => world.url(path)),
    );
  },
});

step({
  pattern: 'I open the url {string}',
  level: 'core',
  description: 'Opens a web address, absolute or relative to the base URL.',
  example: 'I open the url "/login"',
  fn: async ({ world }, url: string) => {
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
