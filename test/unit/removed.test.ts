import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { renderRemovedSteps } from '../../src/docs';
import { defineStep, findStep, findSteps } from '../../src/index';
import { lintFeatures } from '../../src/lint';
import { REMOVED_STEPS, removedMessage, removedStep } from '../../src/removed';

const examples = [
  ['I wait "500" milliseconds', 'I wait {number} millisecond(s)'],
  ['I wait "1" millisecond', 'I wait {number} millisecond(s)'],
  ['I wait "{delay}" milliseconds', 'I wait {number} millisecond(s)'],
  ['I wait for the page to load', 'I wait for the page to load'],
  ['I wait for network idle', 'I wait for network idle'],
  ['I type "Hello" on the keyboard', 'I type {string} on the keyboard'],
  ['I hold down the key "Shift"', 'I hold down the key {string}'],
  ['I release the key "Shift"', 'I release the key {string}'],
  ['I insert the text "嗨"', 'I insert the text {string}'],
  ['I click at x "200" y "150"', 'I click at x {number} y {number}'],
  ['I double click at x "200" y "150"', 'I double click at x {number} y {number}'],
  ['I right click at x "200" y "150"', 'I right click at x {number} y {number}'],
  ['I move the mouse to x "200" y "150"', 'I move the mouse to x {number} y {number}'],
  ['I press the mouse button', 'I press the mouse button'],
  ['I press the "left" mouse button', 'I press the {string} mouse button'],
  ['I release the mouse button', 'I release the mouse button'],
  [
    'I scroll the mouse wheel by x "0" y "100"',
    'I scroll the mouse wheel by x {number} y {number}',
  ],
  ['I tap at x "300" y "200"', 'I tap at x {number} y {number}'],
  ['I scroll down by "500" pixels', 'I scroll down by {number} pixels'],
  ['I scroll up by "200" pixels', 'I scroll up by {number} pixels'],
  [
    'I see the attribute "disabled" on the "Coming Soon" button',
    'I see the attribute {string} on the {element}',
  ],
  [
    'I do not see the attribute "disabled" on the "Transfer Money" button',
    'I do not see the attribute {string} on the {element}',
  ],
  [
    'I see the attribute "href" with the value "/help" on the "Help" link',
    'I see the attribute {string} with the value {string} on the {element}',
  ],
  [
    'I see the attribute "href" containing "help" on the "Help" link',
    'I see the attribute {string} containing {string} on the {element}',
  ],
  [
    'I see the class "highlighted" on the "Styled box" element',
    'I see the class {string} on the {element}',
  ],
  [
    'I do not see the class "hidden" on the "Styled box" element',
    'I do not see the class {string} on the {element}',
  ],
  ['I download the file with the "Export" button', 'I download the file with the {element}'],
  ['I save the downloaded file to "report.csv"', 'I save the downloaded file to {string}'],
] as const;

describe('removed steps', () => {
  it.each(examples)('"%s" is the removed step "%s"', (text, pattern) => {
    expect(removedStep(text)?.pattern).toBe(pattern);
  });

  it('each have an example here', () => {
    const tested = new Set(examples.map(([, pattern]) => pattern));
    for (const { pattern } of REMOVED_STEPS) expect(tested).toContain(pattern);
  });

  it.each([
    'I wait "2" seconds',
    'I wait "2" minutes',
    'I wait 500 milliseconds',
    'I reload the page',
    'I type "Hello" in the "Name" field',
    'I tap the "Menu" button',
  ])('"%s" is no removed step', (text) => {
    expect(removedStep(text)).toBeUndefined();
    expect(removedMessage(text)).toBeUndefined();
  });

  it('match no step that exists', () => {
    for (const [text] of examples) expect(findSteps(text)).toEqual([]);
  });

  it('name what replaces them in findStep()', () => {
    expect(() => findStep('I wait for the page to load')).toThrow(
      '"I wait for the page to load" was removed in 0.3.0. Opening a page and clicking already wait for it.',
    );
  });

  it('are listed in the step reference', () => {
    const table = renderRemovedSteps();
    for (const { pattern } of REMOVED_STEPS) expect(table).toContain(`| \`${pattern}\` | 0.3.0 |`);
  });

  // Last: the step it defines stays registered for the rest of this file.
  it('give way to a project step with the old wording', () => {
    const feature = path.join(__dirname, 'fixtures/lint/removed.feature');
    expect(lintFeatures([feature]).map((message) => message.rule)).toEqual(['undefined-step']);
    const step = defineStep({
      pattern: 'I wait {number} millisecond(s)',
      description: 'Waits for the slow test server.',
      example: 'I wait "500" milliseconds',
      fn: () => {},
    });
    expect(findStep('I wait "500" milliseconds').step).toBe(step);
    expect(lintFeatures([feature]).filter((message) => message.severity !== 'info')).toEqual([]);
  });
});
