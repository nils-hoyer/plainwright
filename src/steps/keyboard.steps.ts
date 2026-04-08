import { expect } from '@playwright/test';
import { When, Then } from '../fixtures/world';

// ---------------------------------------------------------------------------
// Keyboard steps
//
// Supported step patterns:
//   When I type the text "Hello World"  (keyboard simulation, no clear)
//   When I press the key "Enter"
//   When I press "Control+A"
// ---------------------------------------------------------------------------

When('I type the text {string}', async ({ page }, text: string) => {
  await page.keyboard.type(text);
});

When('I press the key {string}', async ({ page }, key: string) => {
  await page.keyboard.press(key);
});
