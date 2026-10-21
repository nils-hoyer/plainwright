import { describe, expect, it } from 'vitest';
import '../../src/index';
import { formatMissingSteps, missingSteps } from '../../src/run';

// What bddgen prints when steps are missing (playwright-bdd 9).
const bddgenOutput = `Missing step definitions: 2

Given('I press the {string} button', async ({}, arg) => {
  // Step: * I press the "Walk" button
  // From: features/todos.feature:13:5
});

Then('I see the welcome', async ({}) => {
  // Step: Then I see the welcome
  // From: features/login.feature:8:5
});

Use snippets above to create missing steps.
`;

describe('plainwright test', () => {
  it('reads the missing steps from the output of bddgen', () => {
    expect(missingSteps(bddgenOutput)).toEqual([
      { text: 'I press the "Walk" button', location: 'features/todos.feature:13' },
      { text: 'I see the welcome', location: 'features/login.feature:8' },
    ]);
    expect(missingSteps('Error: something else')).toEqual([]);
  });

  it('explains missing steps like lint, with the closest step', () => {
    const message = formatMissingSteps(missingSteps(bddgenOutput));
    expect(message).toMatch(
      /^features\/todos\.feature:13: error: Unknown step "I press the "Walk" button"\. Did you mean "I click the "[^"]+" button"\?$/m,
    );
    expect(message).toContain('No test ran');
    expect(message).not.toContain('snippet');
  });
});
