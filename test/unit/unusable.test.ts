import path from 'node:path';
import { defineParameterType as defineBddParameterType } from 'playwright-bdd';
import { describe, expect, it } from 'vitest';
import { defineStep, findSteps } from '../../src/index';
import { formatLintMessage, lintFeatures } from '../../src/lint';
import { getUnusableSteps } from '../../src/registry';

// A parameter type defined with playwright-bdd's own defineParameterType(): playwright-bdd
// knows it, our registry does not.
defineBddParameterType({ name: 'colour', regexp: /red|green/, transformer: (s: string) => s });
const step = defineStep({
  pattern: 'I pick the {colour} colour',
  description: 'Test step.',
  example: 'I pick the red colour',
  fn: () => {},
});

describe('a step with a parameter type the registry does not know', () => {
  it('does not break matching other steps', () => {
    expect(findSteps('I reload the page').map((match) => match.step.pattern)).toEqual([
      'I reload the page',
    ]);
  });

  it('is listed with a hint', () => {
    expect(getUnusableSteps()).toEqual([
      {
        step,
        message:
          'The step "I pick the {colour} colour" uses the parameter type {colour}, which Plainwright does not know. Define it with defineParameterType() from @codesurfer/plainwright instead of playwright-bdd; until then, keywords and lint skip this step.',
      },
    ]);
  });

  it('is reported once by lint, as a warning', () => {
    const root = path.join(__dirname, '../..');
    const messages = lintFeatures([path.join(__dirname, 'fixtures/lint/data.feature')], root);
    expect(
      messages.filter((m) => m.rule === 'unknown-parameter-type').map(formatLintMessage),
    ).toEqual([
      expect.stringMatching(
        /^test\/unit\/unusable\.test\.ts:\d+: warning: The step "I pick the \{colour\} colour" uses the parameter type \{colour\}/,
      ),
    ]);
    expect(messages.filter((m) => m.severity === 'error')).toEqual([]);
  });
});
