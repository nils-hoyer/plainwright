import { defineStep, ElementRef } from '../../src/index';

// A project step that answers a dialog itself, with Playwright's own page.once('dialog').
defineStep({
  pattern: 'I answer the prompt of the {element} with {string} myself',
  description: 'Clicks the element and answers the prompt it opens with its own dialog handler.',
  example: 'I answer the prompt of the "Show Prompt" button with "Mine" myself',
  category: 'Test helpers',
  level: 'advanced',
  fn: async ({ world }, element: ElementRef, answer: string) => {
    let answered: Promise<void> | undefined;
    world.page.once('dialog', (dialog) => {
      answered = dialog.accept(answer);
    });
    await world.withElement(element, (el) => el.click());
    // Fails with "already handled" when something else answered the dialog first.
    await answered;
  },
});
