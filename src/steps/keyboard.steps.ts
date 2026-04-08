import { When } from '../fixtures/world';

// ---------------------------------------------------------------------------
// Keyboard steps
//
// Supported step patterns:
//   When I type the text "Hello World"       (keyboard.type – fires keydown/keyup)
//   When I press the key "Enter"             (keyboard.press – shortcut for down+up)
//   When I hold down the key "Shift"         (keyboard.down – keeps key pressed)
//   When I release the key "Shift"           (keyboard.up  – releases held key)
//   When I insert the text "嗨"              (keyboard.insertText – input event only)
// ---------------------------------------------------------------------------

When('I type the text {string}', async ({ page, world }, text: string) => {
  await world.getPage(page).keyboard.type(text);
});

When('I press the key {string}', async ({ page, world }, key: string) => {
  await world.getPage(page).keyboard.press(key);
});

When('I hold down the key {string}', async ({ page, world }, key: string) => {
  await world.getPage(page).keyboard.down(key);
});

When('I release the key {string}', async ({ page, world }, key: string) => {
  await world.getPage(page).keyboard.up(key);
});

When('I insert the text {string}', async ({ page, world }, text: string) => {
  await world.getPage(page).keyboard.insertText(text);
});
