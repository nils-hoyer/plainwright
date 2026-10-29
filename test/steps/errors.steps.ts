import { expect } from '@playwright/test';
import { DataTable } from 'playwright-bdd';
import { defineStep, findStep } from '../../src/index';

// Test helper: checks the error message of a step that is expected to fail.
defineStep({
  pattern: 'I see this step fail with {string}:',
  description:
    'Runs the step in the doc string, with the table in the lines after it, and checks that it fails with an error containing the text.',
  example: 'I see this step fail with "No page named":',
  category: 'Test helpers',
  level: 'advanced',
  fn: async ({ page, world }, expected: string, stepText: string) => {
    const [text, ...lines] = stepText.trim().split('\n');
    const rows = lines
      .map((line) => line.trim())
      .filter((line) => line.startsWith('|'))
      .map((line) =>
        line
          .slice(1, -1)
          .split('|')
          .map((cell) => cell.trim()),
      );
    const { step, args } = findStep(text.trim());
    if (rows.length) args.push(new DataTable(rows));
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
