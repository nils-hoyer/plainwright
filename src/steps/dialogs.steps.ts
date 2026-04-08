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

When('I accept the dialog', async ({ page }) => {
  page.once('dialog', (dialog) => dialog.accept());
});

When('I dismiss the dialog', async ({ page }) => {
  page.once('dialog', (dialog) => dialog.dismiss());
});

When('I accept the dialog with text {string}', async ({ page }, promptText: string) => {
  page.once('dialog', (dialog) => dialog.accept(promptText));
});

Then('a dialog with message {string} is shown', async ({ page }, expectedMessage: string) => {
  await new Promise<void>((resolve, reject) => {
    page.once('dialog', async (dialog) => {
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
