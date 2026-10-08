import path from 'node:path';
import { expect } from '@playwright/test';
import type { ElementRef } from '../elements';
import type { World } from '../world';
import { category } from './builtin';

const step = category('Downloads');

step({
  pattern: 'I download the file with the {element}',
  level: 'advanced',
  description: 'Clicks the element and waits until the file it offers has downloaded.',
  example: 'I download the file with the "Download Test File" button',
  fn: async ({ world }, element: ElementRef) => {
    const download = world.page.waitForEvent('download');
    await world.withElement(element, (el) => el.click());
    world.download = await download;
    const failure = await world.download.failure();
    if (failure) throw new Error(`[playwright-keywords] The download failed: ${failure}`);
  },
});

step({
  pattern: 'I see the downloaded file {string}',
  level: 'advanced',
  description: 'Checks the file name of the last download.',
  example: 'I see the downloaded file "test-download.txt"',
  fn: ({ world }, fileName: string) => {
    expect(lastDownload(world).suggestedFilename()).toBe(fileName);
  },
});

step({
  pattern: 'I save the downloaded file to {string}',
  level: 'advanced',
  description: 'Saves the last download at this path, relative to the project folder.',
  example: 'I save the downloaded file to "test-results/report.csv"',
  fn: async ({ world }, filePath: string) => {
    await lastDownload(world).saveAs(path.resolve(process.cwd(), filePath));
  },
});

function lastDownload(world: World) {
  if (!world.download) {
    throw new Error(
      '[playwright-keywords] Nothing was downloaded yet. Use I download the file with the ... first.',
    );
  }
  return world.download;
}
