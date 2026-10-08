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
  example: 'I double click the "Double click me" button',
  fn: async ({ world }, element: ElementRef) => {
    await world.withElement(element, (el) => el.dblclick());
  },
});

step({
  pattern: 'I right click the {element}',
  level: 'advanced',
  description:
    'Clicks the element with the right mouse button, which usually opens a context menu.',
  example: 'I right click the "Right click me" element',
  fn: async ({ world }, element: ElementRef) => {
    await world.withElement(element, (el) => el.click({ button: 'right' }));
  },
});

step({
  pattern: 'I hover over the {element}',
  level: 'core',
  description: 'Moves the mouse over the element without clicking.',
  example: 'I hover over the "Hover over me" element',
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
  example: 'I upload the file "test/test-app/test-file.txt" with the "Choose File" button',
  fn: async ({ world }, file: string, element: ElementRef) => {
    await upload(world, element, [file]);
  },
});

step({
  pattern: 'I upload the files {string} with the {element}',
  level: 'advanced',
  description:
    'Chooses several files, separated by commas, in the file field or in the file dialog the element opens.',
  example: 'I upload the files "a.txt, b.txt" with the "Choose Multiple Files" button',
  fn: async ({ world }, files: string, element: ElementRef) => {
    await upload(
      world,
      element,
      files.split(',').map((file) => file.trim()),
    );
  },
});

step({
  pattern: 'I drag the {element} to the {element}',
  level: 'core',
  description: 'Drags the first element with the mouse and drops it onto the second.',
  example: 'I drag the "Drag Me" element to the "Drop Here" element',
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
    await el.click();
    await (await fileChooser).setFiles(paths);
  });
}
