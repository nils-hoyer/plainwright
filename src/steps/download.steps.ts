import fs from 'node:fs';
import { expect, test } from '@playwright/test';
import type { ElementRef } from '../elements';
import type { World } from '../world';
import { upload } from './actions.steps';
import { category } from './builtin';

const step = category('Downloads');

step({
  pattern: 'I download the file with the {element}',
  level: 'advanced',
  description: 'Clicks the element and waits until the file it offers has downloaded.',
  example: 'I download the file with the "Export" button',
  fn: async ({ world }, element: ElementRef) => {
    const download = world.page.waitForEvent('download');
    // When the click fails, its error is the one to report, not a later one from waiting.
    download.catch(() => {});
    await world.withElement(element, (el) => el.click());
    world.download = await download;
    const failure = await world.download.failure();
    if (failure) throw new Error(`[plainwright] The download failed: ${failure}`);
  },
});

step({
  pattern: 'I see the downloaded file {string}',
  level: 'advanced',
  description: 'Checks the file name of the last download.',
  example: 'I see the downloaded file "orders.csv"',
  fn: ({ world }, fileName: string) => {
    expect(lastDownload(world).suggestedFilename()).toBe(fileName);
  },
});

step({
  pattern: 'I see the text {string} in the downloaded file',
  level: 'advanced',
  description: 'Checks that the last download contains this text, with the same capitals.',
  example: 'I see the text "Total" in the downloaded file',
  fn: async ({ world }, text: string) => {
    const file = await lastDownload(world).path();
    expect(
      fs.readFileSync(file, 'utf8'),
      `Expected the downloaded file to contain "${text}"`,
    ).toContain(text);
  },
});

step({
  pattern: 'I upload the downloaded file with the {element}',
  level: 'advanced',
  description:
    'Chooses the last download, with its own file name, in the file field or in the file dialog the element opens, such as to import an export again.',
  example: 'I upload the downloaded file with the "Import" button',
  fn: async ({ world }, element: ElementRef) => {
    const download = lastDownload(world);
    // Playwright keeps a download under a random name; an import may need the real one.
    const file = test.info().outputPath('downloads', download.suggestedFilename());
    await download.saveAs(file);
    await upload(world, element, [file]);
  },
});

function lastDownload(world: World) {
  if (!world.download) {
    throw new Error(
      '[plainwright] Nothing was downloaded yet. Use I download the file with the ... first.',
    );
  }
  return world.download;
}
