import { defineStep } from 'playwright-keywords';

// Every todo has a checkbox named "Toggle Todo", so a step picks the right one by its text.
defineStep({
  pattern: 'I complete the todo {string}',
  description: 'Ticks the checkbox of the todo with this text.',
  example: 'I complete the todo "Buy milk"',
  category: 'Todos',
  fn: async ({ world }, text: string) => {
    await world.page
      .getByTestId('todo-item')
      .filter({ hasText: text })
      .getByRole('checkbox', { name: 'Toggle Todo' })
      .check();
  },
});
