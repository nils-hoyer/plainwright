import { expect } from '@playwright/test';
import { defineStep } from 'plainwright';
import type { Fixtures } from './fixtures';

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
