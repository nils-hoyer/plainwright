import path from 'node:path';
import { When } from '../fixtures/world';

// ---------------------------------------------------------------------------
// FileChooser steps
//
// Opens a file chooser dialog by clicking a trigger element and then sets
// the file(s) on the dialog.
//
// Relative file paths are resolved against process.cwd() (the project root
// when running `npx playwright test`).
//
// Supported step patterns:
//   When I click "btn upload" and set the file "test/test-app/test-file.txt"
//   When I click "btn upload" and set the files "file1.txt, file2.txt"
// ---------------------------------------------------------------------------

function resolvePath(filePath: string): string {
  return path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
}

When(
  'I click {string} and set the file {string}',
  async ({ page, world }, reference: string, filePath: string) => {
    const selector = world.resolve(reference);
    const fileChooserPromise = world.getPage(page).waitForEvent('filechooser');
    await world.locator(page, selector).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(resolvePath(filePath));
  },
);

When(
  'I click {string} and set the files {string}',
  async ({ page, world }, reference: string, filePathsCsv: string) => {
    const selector = world.resolve(reference);
    const files = filePathsCsv.split(',').map((f) => resolvePath(f.trim()));
    const fileChooserPromise = world.getPage(page).waitForEvent('filechooser');
    await world.locator(page, selector).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(files);
  },
);
