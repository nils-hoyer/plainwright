import { expect } from '@playwright/test';
import { defineStep, findStep } from '../../src/index';

// Test helper: checks the error message of a step that is expected to fail.
defineStep({
  pattern: 'I see this step fail with {string}:',
  description:
    'Runs the step in the doc string and checks that it fails with an error containing the text.',
  example: 'I see this step fail with "No page named":',
  category: 'Test helpers',
  level: 'advanced',
  fn: async ({ page, world }, expected: string, stepText: string) => {
    const { step, args } = findStep(stepText.trim());
    world.page.setDefaultTimeout(1000);
    let message = '(the step did not fail)';
    try {
      await step.fn.call({}, { page, world }, ...args);
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    } finally {
      world.page.setDefaultTimeout(10_000);
    }
    // Playwright highlights differences with terminal colors.
    expect(message.replace(/\x1b\[[0-9;]*m/g, '')).toContain(expected);
  },
});
