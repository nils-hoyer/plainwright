import { defineStep } from '../../../src/index';

// The folder name @member limits this step to scenarios tagged @member.
// test/steps/@guest/ defines the same wording for @guest scenarios.
defineStep({
  pattern: 'I open the start page',
  description: 'Opens the page members start on: the dashboard.',
  example: 'I open the start page',
  category: 'Start page',
  fn: async ({ world }) => {
    await world.page.goto(String(world.usePage('Dashboard').url));
  },
});
