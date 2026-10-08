import { defineStep } from '../../../src/index';

// The folder name @guest limits this step to scenarios tagged @guest.
// test/steps/@member/ defines the same wording for @member scenarios.
defineStep({
  pattern: 'I open the start page',
  description: 'Opens the page guests start on: the login page.',
  example: 'I open the start page',
  category: 'Start page',
  fn: async ({ world }) => {
    await world.page.goto(String(world.usePage('Login').url));
  },
});
