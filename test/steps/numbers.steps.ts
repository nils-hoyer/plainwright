import { defineStep } from '../../src/index';

// The example from docs/test-data.md: a step of the project takes a number out of a text.
defineStep({
  pattern: 'I remember the number in {string} as {string}',
  description: 'Keeps the first number in the text, such as 10234 in "Order #10234 was created.".',
  example: 'I remember the number in "Order #10234 was created." as "order"',
  category: 'Test data',
  remembers: (args) => String(args[1]),
  fn: ({ world }, text: string, name: string) => {
    const number = text.match(/\d+/)?.[0];
    if (!number) throw new Error(`There is no number in "${text}".`);
    world.remember(name, number);
  },
});
