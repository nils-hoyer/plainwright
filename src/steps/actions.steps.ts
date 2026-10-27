import path from 'node:path';
import type { ElementRef } from '../elements';
import type { World } from '../world';
import { category } from './builtin';

const step = category('Clicking and typing');

step({
  pattern: 'I click the {element}',
  level: 'core',
  description: 'Clicks the element once with the left mouse button.',
  example: 'I click the "Log in" button',
  fn: async ({ world }, element: ElementRef) => {
    await world.withElement(element, (el) => el.click());
  },
});

step({
  pattern: 'I double click the {element}',
  level: 'core',
  description: 'Double-clicks the element.',
  example: 'I double click the "Order 1001" row',
  fn: async ({ world }, element: ElementRef) => {
    await world.withElement(element, (el) => el.dblclick());
  },
});

step({
  pattern: 'I right click the {element}',
  level: 'advanced',
  description:
    'Clicks the element with the right mouse button, which usually opens a context menu.',
  example: 'I right click the "Order 1001" row',
  fn: async ({ world }, element: ElementRef) => {
    await world.withElement(element, (el) => el.click({ button: 'right' }));
  },
});

step({
  pattern: 'I hover over the {element}',
  level: 'core',
  description: 'Moves the mouse over the element without clicking.',
  example: 'I hover over the "Help" link',
  fn: async ({ world }, element: ElementRef) => {
    await world.withElement(element, (el) => el.hover());
  },
});

step({
  pattern: 'I focus on the {element}',
  level: 'advanced',
  description: 'Puts the keyboard focus on the element without clicking it.',
  example: 'I focus on the "Full Name" field',
  fn: async ({ world }, element: ElementRef) => {
    await world.withElement(element, (el) => el.focus());
  },
});

step({
  pattern: 'I fill {string} in the {element}',
  level: 'core',
  description: 'Replaces the content of the field with the text.',
  example: 'I fill "1234567890" in the "Username" field',
  fn: async ({ world }, text: string, element: ElementRef) => {
    await world.withElement(element, (el) => el.fill(text));
  },
});

step({
  pattern: 'I type {string} in the {element}',
  level: 'advanced',
  description:
    'Types the text key by key after what is already in the field, for fields that react to every key, such as a date with a mask or a search with suggestions.',
  example: 'I type "21102026" in the "Birthday" field',
  fn: async ({ world }, text: string, element: ElementRef) => {
    await world.withElement(element, async (el) => {
      await el.evaluate(focusAtEnd);
      await el.pressSequentially(text);
    });
  },
});

/**
 * Focuses the field with the cursor after its content. Playwright types at the start of a field
 * that does not have the focus yet. A field that has the focus keeps its cursor, so a key pressed
 * in it before (such as Home) still counts.
 */
function focusAtEnd(node: Element): void {
  if (node === document.activeElement || !(node instanceof HTMLElement)) return;
  node.focus();
  if (node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement) {
    try {
      node.setSelectionRange(node.value.length, node.value.length);
    } catch {
      // Some inputs, such as email and number, have no cursor position to set.
    }
  } else if (node.isContentEditable) {
    const range = document.createRange();
    range.selectNodeContents(node);
    range.collapse(false);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);
  }
}

step({
  pattern: 'I clear the {element}',
  level: 'core',
  description: 'Removes all text from the field.',
  example: 'I clear the "Full Name" field',
  fn: async ({ world }, element: ElementRef) => {
    await world.withElement(element, (el) => el.clear());
  },
});

step({
  pattern: 'I check the {element}',
  level: 'core',
  description:
    'Ticks the checkbox or selects the radio button. Nothing changes if it is already ticked.',
  example: 'I check the "I accept the terms and conditions" checkbox',
  fn: async ({ world }, element: ElementRef) => {
    await world.withElement(element, (el) => el.check());
  },
});

step({
  pattern: 'I uncheck the {element}',
  level: 'core',
  description: 'Unticks the checkbox. Nothing changes if it is already unticked.',
  example: 'I uncheck the "Subscribe to newsletter" checkbox',
  fn: async ({ world }, element: ElementRef) => {
    await world.withElement(element, (el) => el.uncheck());
  },
});

step({
  pattern: 'I select {string} in the {element}',
  level: 'core',
  description: 'Chooses the option with this visible text in the dropdown.',
  example: 'I select "Germany" in the "Country" dropdown',
  fn: async ({ world }, option: string, element: ElementRef) => {
    await world.withElement(element, (el) => el.selectOption({ label: option }));
  },
});

step({
  pattern: 'I select option {number} in the {element}',
  level: 'advanced',
  description: 'Chooses the option at this position in the dropdown, counting from 1.',
  example: 'I select option "3" in the "Country" dropdown',
  fn: async ({ world }, position: number, element: ElementRef) => {
    await world.withElement(element, (el) => el.selectOption({ index: position - 1 }));
  },
});

step({
  pattern: 'I press {string}',
  level: 'core',
  description:
    'Presses a key or key combination, such as "Enter", "Tab" or "Control+A", on the focused element.',
  example: 'I press "Enter"',
  fn: async ({ world }, key: string) => {
    await world.page.keyboard.press(key);
  },
});

step({
  pattern: 'I press {string} in the {element}',
  level: 'core',
  description: 'Focuses the element and presses a key or key combination there.',
  example: 'I press "Enter" in the "Email" field',
  fn: async ({ world }, key: string, element: ElementRef) => {
    await world.withElement(element, (el) => el.press(key));
  },
});

step({
  pattern: 'I upload the file {string} with the {element}',
  level: 'core',
  description:
    'Chooses this file (path relative to the project folder) in the file field, or in the file dialog the element opens.',
  example: 'I upload the file "files/invoice.pdf" with the "Upload" button',
  fn: async ({ world }, file: string, element: ElementRef) => {
    await upload(world, element, [file]);
  },
});

step({
  pattern: 'I upload the files {string} with the {element}',
  level: 'advanced',
  description:
    'Chooses several files, separated by commas, in the file field or in the file dialog the element opens.',
  example: 'I upload the files "files/invoice.pdf, files/receipt.pdf" with the "Upload" button',
  fn: async ({ world }, files: string, element: ElementRef) => {
    await upload(
      world,
      element,
      files.split(',').map((file) => file.trim()),
    );
  },
});

step({
  pattern: 'I tap the {element}',
  level: 'advanced',
  description: 'Taps the element on a touch screen. Needs a browser with touch enabled (hasTouch).',
  example: 'I tap the "Menu" button',
  fn: async ({ world }, element: ElementRef) => {
    await world.withElement(element, (el) => el.tap());
  },
});

step({
  pattern: 'I drag the {element} to the {element}',
  level: 'core',
  description: 'Drags the first element with the mouse and drops it onto the second.',
  example: 'I drag the "Coffee" list item to the "Cart" list',
  fn: async ({ world }, source: ElementRef, target: ElementRef) => {
    const targetElement = world.element(target);
    await world.withElement(source, (el) => el.dragTo(targetElement));
  },
});

async function upload(world: World, element: ElementRef, files: string[]) {
  const paths = files.map((file) => path.resolve(process.cwd(), file));
  await world.withElement(element, async (el) => {
    const isFileInput = await el.evaluate(
      (node) => node instanceof HTMLInputElement && node.type === 'file',
    );
    if (isFileInput) {
      await el.setInputFiles(paths);
      return;
    }
    const fileChooser = world.page.waitForEvent('filechooser');
    // When the click fails, its error is the one to report, not a later one from waiting.
    fileChooser.catch(() => {});
    await el.click();
    await (await fileChooser).setFiles(paths);
  });
}
