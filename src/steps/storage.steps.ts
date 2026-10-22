import { expect, test } from '@playwright/test';
import { checkSessionTag, sessionFile, SETUP_TAG } from '../session';
import type { World } from '../world';
import { category } from './builtin';

const step = category('Cookies and storage');

step({
  pattern: 'I set the cookie {string} to {string}',
  level: 'advanced',
  description: 'Stores a cookie with this name and value for the current website.',
  example: 'I set the cookie "session" to "abc123"',
  fn: async ({ world }, name: string, value: string) => {
    const url = world.page.url();
    if (!/^https?:/.test(url)) {
      throw new Error(`[plainwright] Cannot set a cookie on "${url}". Open a web page first.`);
    }
    // For the whole site. With the page URL, the browser would limit the cookie to its folder.
    await world.page.context().addCookies([{ name, value, url: new URL('/', url).toString() }]);
  },
});

step({
  pattern: 'I delete the cookie {string}',
  level: 'advanced',
  description: 'Removes the cookie with this name.',
  example: 'I delete the cookie "session"',
  fn: async ({ world }, name: string) => {
    await world.page.context().clearCookies({ name });
  },
});

step({
  pattern: 'I clear all cookies',
  level: 'advanced',
  description: 'Removes all cookies of the browser session.',
  example: 'I clear all cookies',
  fn: async ({ world }) => {
    await world.page.context().clearCookies();
  },
});

step({
  pattern: 'I see the cookie {string}',
  level: 'advanced',
  description: 'Checks that a cookie with this name exists.',
  example: 'I see the cookie "cookies_accepted"',
  fn: async ({ world }, name: string) => {
    await expect
      .poll(() => cookieNames(world.page.context()), { message: `Expected cookie "${name}"` })
      .toContain(name);
  },
});

step({
  pattern: 'I do not see the cookie {string}',
  level: 'advanced',
  description: 'Checks that no cookie with this name exists.',
  example: 'I do not see the cookie "session"',
  fn: async ({ world }, name: string) => {
    await expect
      .poll(() => cookieNames(world.page.context()), { message: `Expected no cookie "${name}"` })
      .not.toContain(name);
  },
});

step({
  pattern: 'I see the cookie {string} with the value {string}',
  level: 'advanced',
  description: 'Checks that the cookie with this name has exactly this value.',
  example: 'I see the cookie "session" with the value "abc123"',
  fn: async ({ world }, name: string, value: string) => {
    await expect
      .poll(
        async () =>
          (await world.page.context().cookies()).find((cookie) => cookie.name === name)?.value,
        { message: `Expected cookie "${name}" to have the value "${value}"` },
      )
      .toBe(value);
  },
});

step({
  pattern: 'I set the local storage item {string} to {string}',
  level: 'advanced',
  description: 'Stores a value in the local storage of the current website.',
  example: 'I set the local storage item "theme" to "dark"',
  fn: async ({ world }, key: string, value: string) => {
    await world.page.evaluate(([k, v]) => localStorage.setItem(k, v), [key, value]);
  },
});

step({
  pattern: 'I clear the local storage',
  level: 'advanced',
  description: 'Removes all values from the local storage of the current website.',
  example: 'I clear the local storage',
  fn: async ({ world }) => {
    await world.page.evaluate(() => localStorage.clear());
  },
});

step({
  pattern: 'I see the local storage item {string} with the value {string}',
  level: 'advanced',
  description:
    'Checks that the local storage of the current website has this value under this key.',
  example: 'I see the local storage item "theme" with the value "dark"',
  fn: async ({ world }, key: string, value: string) => {
    await expect
      .poll(() => world.page.evaluate((k) => localStorage.getItem(k), key), {
        message: `Expected local storage item "${key}" to be "${value}"`,
      })
      .toBe(value);
  },
});

// Logging in once (docs/logging-in.md): a scenario tagged @setup logs in and keeps the session.

step({
  pattern: 'I keep the session',
  level: 'advanced',
  description:
    'Saves the cookies and storage of the browser, so every scenario after the @setup ones starts with them, except those tagged @logged-out.',
  example: 'I keep the session',
  fn: async ({ world }) => {
    await keepSession(world);
  },
});

step({
  pattern: 'I keep the session for {string} scenarios',
  level: 'advanced',
  description:
    'Saves the cookies and storage of the browser for the scenarios with this tag, which start with them instead of the session kept for all.',
  example: 'I keep the session for "@admin" scenarios',
  fn: async ({ world }, tag: string) => {
    const problem = checkSessionTag(tag);
    if (problem) throw new Error(`[plainwright] ${problem}`);
    await keepSession(world, tag);
  },
});

async function keepSession(world: World, tag?: string) {
  const { tags, project, config } = test.info();
  if (!tags.includes(SETUP_TAG)) {
    throw new Error(
      `[plainwright] A session is kept in a scenario tagged ${SETUP_TAG}, which runs before the ` +
        `others when the configuration has setup: true. See docs/logging-in.md.`,
    );
  }
  // Otherwise the other scenarios run at the same time and may start before it is kept.
  if (!config.projects.some((other) => other.dependencies.includes(project.name))) {
    throw new Error(
      `[plainwright] No project waits for the project "${project.name}", so other scenarios ` +
        `may start before the session is kept. Add setup: true to the configuration. See ` +
        `docs/logging-in.md.`,
    );
  }
  // IndexedDB too: some sign-in libraries, such as Firebase, keep the login there.
  await world.page.context().storageState({ path: sessionFile(tag), indexedDB: true });
}

async function cookieNames(context: import('@playwright/test').BrowserContext) {
  return (await context.cookies()).map((cookie) => cookie.name);
}
