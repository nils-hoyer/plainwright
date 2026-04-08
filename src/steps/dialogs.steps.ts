import { When, Then } from '../fixtures/world';
import { expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// Dialog (alert / confirm / prompt) steps
//
// Supported step patterns:
//   When I accept the dialog
//   When I dismiss the dialog
//   When I accept the dialog with text "my prompt answer"
//   Then a dialog with message "Are you sure?" is shown
// ---------------------------------------------------------------------------

When('I accept the dialog', async ({ page, world }) => {
  world.getPage(page).once('dialog', async (dialog) => {
    await dialog.accept();
  });
});

When('I dismiss the dialog', async ({ page, world }) => {
  world.getPage(page).once('dialog', async (dialog) => {
    await dialog.dismiss();
  });
});

When('I accept the dialog with text {string}', async ({ page, world }, promptText: string) => {
  world.getPage(page).once('dialog', async (dialog) => {
    await dialog.accept(promptText);
  });
});

Then('a dialog with message {string} is shown', async ({ page, world }, expectedMessage: string) => {
  await new Promise<void>((resolve, reject) => {
    world.getPage(page).once('dialog', async (dialog) => {
      try {
        expect(dialog.message()).toBe(expectedMessage);
        await dialog.dismiss();
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  });
});
