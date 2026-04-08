import { When, Then } from '../fixtures/world';
import { expect } from '@playwright/test';
import type { Download } from '@playwright/test';

// ---------------------------------------------------------------------------
// Download steps
//
// Pattern: click a trigger → capture download → assert properties / save file.
// The download object is kept in a module-level variable which is safe because
// Playwright workers execute tests sequentially within a single worker process.
//
// Supported step patterns:
//   When I click "link download" and wait for the download
//   When I save the download to "/tmp/result.txt"
//   Then the download filename is "report.csv"
//   Then the download filename contains "report"
//   Then the download url contains "files/"
//   Then the download succeeds
// ---------------------------------------------------------------------------

let lastDownload: Download | null = null;

When(
  'I click {string} and wait for the download',
  async ({ page, world }, reference: string) => {
    const selector = world.resolve(reference);
    const downloadPromise = world.getPage(page).waitForEvent('download');
    await world.locator(page, selector).click();
    lastDownload = await downloadPromise;
  },
);

When('I save the download to {string}', async ({}, savePath: string) => {
  if (!lastDownload) {
    throw new Error(
      '[playwright-bdd-steps] No download available. Use "I click ... and wait for the download" first.',
    );
  }
  await lastDownload.saveAs(savePath);
});

Then('the download filename is {string}', async ({}, expected: string) => {
  if (!lastDownload) throw new Error('[playwright-bdd-steps] No download available.');
  expect(lastDownload.suggestedFilename()).toBe(expected);
});

Then('the download filename contains {string}', async ({}, partial: string) => {
  if (!lastDownload) throw new Error('[playwright-bdd-steps] No download available.');
  expect(lastDownload.suggestedFilename()).toContain(partial);
});

Then('the download url contains {string}', async ({}, partial: string) => {
  if (!lastDownload) throw new Error('[playwright-bdd-steps] No download available.');
  expect(lastDownload.url()).toContain(partial);
});

Then('the download succeeds', async ({}) => {
  if (!lastDownload) throw new Error('[playwright-bdd-steps] No download available.');
  const failure = await lastDownload.failure();
  expect(failure).toBeNull();
});
