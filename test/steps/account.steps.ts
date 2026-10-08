import { defineStep, ElementRef } from '../../src/index';
import type { Fixtures } from './fixtures';

// A project step that uses a fixture of the project's own `test` (see fixtures.ts).
defineStep<Fixtures>({
  pattern: 'I log in as the test user',
  description: 'Logs in on the open login page with the user from the testUser fixture.',
  example: 'I log in as the test user',
  category: 'Account',
  fn: async ({ world, testUser }) => {
    await world.withElement(new ElementRef('Username', 'field'), (el) =>
      el.fill(testUser.username),
    );
    await world.withElement(new ElementRef('Password', 'field'), (el) =>
      el.fill(testUser.password),
    );
    await world.withElement(new ElementRef('Log in', 'button'), (el) => el.click());
  },
});
