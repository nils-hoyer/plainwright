import fs from 'node:fs';
import { type Download, expect } from '@playwright/test';
import type { World } from '../world';
import { category } from './builtin';

const step = category('Downloads');

step({
  pattern: 'I see the downloaded file {string}',
  level: 'advanced',
  description:
    'Checks the file name of the last download, and waits for it after a click on a link or button.',
  example: 'I see the downloaded file "orders.csv"',
  fn: async ({ world }, fileName: string) => {
    await lastDownload(world);
    // After a second download, the first one is there until the second one arrives.
    await expect
      .poll(() => world.download?.suggestedFilename(), {
        message: 'The file name of the last download',
      })
      .toBe(fileName);
  },
});

step({
  pattern: 'I see the text {string} in the downloaded file',
  level: 'advanced',
  description:
    'Checks that the last download contains this text, with the same capitals, and waits for it after a click.',
  example: 'I see the text "Total" in the downloaded file',
  fn: async ({ world }, text: string) => {
    const file = await (await lastDownload(world)).path();
    expect(
      fs.readFileSync(file, 'utf8'),
      `Expected the downloaded file to contain "${text}"`,
    ).toContain(text);
  },
});

/**
 * The last download, once it has finished. After a click it may still be on its way, so this
 * waits for it like a check waits for an element.
 */
async function lastDownload(world: World): Promise<Download> {
  try {
    await expect.poll(() => world.download !== undefined).toBe(true);
  } catch {
    throw new Error(
      '[plainwright] Nothing was downloaded. Click the link or button that offers the file first, such as I click the "Export" button.',
    );
  }
  const download = world.download as Download;
  const failure = await download.failure();
  if (failure) throw new Error(`[plainwright] The download failed: ${failure}`);
  return download;
}
