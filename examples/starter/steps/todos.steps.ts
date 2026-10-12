import { expect } from '@playwright/test';
import { defineStep } from 'plainwright';
import type { Fixtures } from './fixtures';

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

// A step that uses a fixture from steps/fixtures.ts.
defineStep<Fixtures>({
  pattern: 'I see {number} todo(s) saved in the browser',
  description: 'Checks how many todos the app saved in the local storage of the browser.',
  example: 'I see "2" todos saved in the browser',
  category: 'Todos',
  fn: async ({ savedTodos }, count: number) => {
    await expect.poll(async () => (await savedTodos()).length).toBe(count);
  },
});
