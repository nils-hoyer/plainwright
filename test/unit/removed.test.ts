import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { renderRemovedSteps } from '../../src/docs';
import { defineStep, findStep, findSteps } from '../../src/index';
import { lintFeatures } from '../../src/lint';
import { REMOVED_STEPS, removedMessage, removedStep } from '../../src/removed';

describe('removed steps', () => {
  it.each([
    ['I wait "2" seconds', 'I wait {number} second(s)'],
    ['I wait "1" second', 'I wait {number} second(s)'],
    ['I wait "{delay}" seconds', 'I wait {number} second(s)'],
    ['I wait "500" milliseconds', 'I wait {number} millisecond(s)'],
    ['I wait for the page to load', 'I wait for the page to load'],
    ['I wait for network idle', 'I wait for network idle'],
  ])('"%s" is the removed step "%s"', (text, pattern) => {
    expect(removedStep(text)?.pattern).toBe(pattern);
  });

  it.each(['I wait "2" minutes', 'I wait 2 seconds', 'I reload the page'])(
    '"%s" is no removed step',
    (text) => {
      expect(removedStep(text)).toBeUndefined();
      expect(removedMessage(text)).toBeUndefined();
    },
  );

  it('match no step that exists', () => {
    const texts = ['I wait "2" seconds', 'I wait "500" milliseconds', 'I wait for network idle'];
    for (const text of texts) expect(findSteps(text)).toEqual([]);
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
    const step = defineStep({
      pattern: 'I wait {number} second(s)',
      description: 'Waits for the slow test server.',
      example: 'I wait "2" seconds',
      fn: () => {},
    });
    expect(findStep('I wait "2" seconds').step).toBe(step);
    const lint = lintFeatures([path.join(__dirname, 'fixtures/lint/problems.feature')]);
    expect(lint.filter((message) => message.line === 8)).toEqual([]);
  });
});
