import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadPlaywrightConfig } from '../../src/load';
import { withoutSnippets } from '../../src/run';

// What bddgen prints when steps are missing (playwright-bdd 9), after another error.
const bddgenOutput = `Error: features/broken.feature: Parser errors

Missing step definitions: 1

Given('I press the {string} button', async ({}, arg) => {
  // Step: Gegeben sei I press the "Walk" button
  // From: features/todos.feature:13:5
});

Use snippets above to create missing steps.
`;

describe('plainwright test', () => {
  it('leaves out the code snippets of bddgen but keeps its other errors', () => {
    expect(withoutSnippets(bddgenOutput)).toBe('Error: features/broken.feature: Parser errors\n\n');
    expect(withoutSnippets(bddgenOutput.replace(/\n/g, '\r\n'))).not.toContain('Missing step');
  });

  it('reads the feature and step files from the configuration, without the built-in steps', async () => {
    const root = path.resolve(__dirname, '../..');
    const loaded = await loadPlaywrightConfig(root);
    expect(loaded?.config.use?.baseURL).toMatch(/^http:\/\/localhost:\d+$/);
    expect(loaded?.bdd).toEqual([
      { cwd: root, features: ['test/features/**/*.feature'], steps: ['test/steps/**/*.ts'] },
    ]);
    // bddgen and Playwright, started after this, read their own configuration.
    expect(process.env.PLAYWRIGHT_BDD_CONFIGS).toBeUndefined();
  });
});
