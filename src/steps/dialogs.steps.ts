import { expect } from '@playwright/test';
import { category } from './builtin';

const step = category('Dialogs');

// Browser dialogs (alert, confirm, prompt) block the page until they are answered.
// Say how to answer the next one *before* the step that opens it. Unannounced dialogs are dismissed.

step({
  pattern: 'I accept the next dialog',
  level: 'core',
  description:
    'Clicks OK in the next alert, confirm or prompt dialog. Use it before the step that opens the dialog.',
  example: 'I accept the next dialog',
  fn: ({ world }) => {
    world.setNextDialogAction({ accept: true });
  },
});

step({
  pattern: 'I accept the next dialog with {string}',
  level: 'advanced',
  description:
    'Types the text into the next prompt dialog and clicks OK. Use it before the step that opens the dialog.',
  example: 'I accept the next dialog with "My answer"',
  fn: ({ world }, text: string) => {
    world.setNextDialogAction({ accept: true, promptText: text });
  },
});

step({
  pattern: 'I dismiss the next dialog',
  level: 'core',
  description:
    'Clicks Cancel in the next confirm or prompt dialog. Use it before the step that opens the dialog.',
  example: 'I dismiss the next dialog',
  fn: ({ world }) => {
    world.setNextDialogAction({ accept: false });
  },
});

step({
  pattern: 'I see a dialog with the message {string}',
  level: 'core',
  description: 'Checks that a dialog with exactly this message was shown during the test.',
  example: 'I see a dialog with the message "Do you confirm?"',
  fn: async ({ world }, message: string) => {
    await expect
      .poll(() => world.dialogs.map((dialog) => dialog.message), {
        message: `Expected a dialog with the message "${message}"`,
      })
      .toContain(message);
  },
});
