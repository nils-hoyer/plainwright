import { When } from '../fixtures/world';

// ---------------------------------------------------------------------------
// Keyboard steps
//
// Supported step patterns:
//   When I type the text "Hello World"  (keyboard simulation, no clear)
//   When I press the key "Enter"
//   When I press "Control+A"
// ---------------------------------------------------------------------------

When('I type the text {string}', async ({ page, world }, text: string) => {
  await world.getPage(page).keyboard.type(text);
});

When('I press the key {string}', async ({ page, world }, key: string) => {
  await world.getPage(page).keyboard.press(key);
});
