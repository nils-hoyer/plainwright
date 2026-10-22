import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadPlaywrightConfig } from '../../src/load';
import { readableParseErrors, withoutSnippets } from '../../src/run';

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

  it('writes the syntax errors of bddgen in words', () => {
    expect(
      readableParseErrors(
        `Error: Parse error in "features/a.feature" (5:3): expected: #EOF, #TableRow, #DocStringSeparator, #StepLine, #TagLine, #ExamplesLine, #ScenarioLine, #RuleLine, #Comment, #Empty, got 'Click the Save button'\n`,
      ),
    ).toBe(
      'features/a.feature:5:3: "Click the Save button" is not a step: steps start with * (or Given, When, Then). Other text goes right below the "Feature:" or "Scenario:" line, or after # as a comment.\n',
    );
  });

  it('reads the feature and step files from the configuration, without the built-in steps', async () => {
    const root = path.resolve(__dirname, '../..');
    const loaded = await loadPlaywrightConfig(root);
    expect(loaded?.config.use?.baseURL).toMatch(/^http:\/\/localhost:\d+$/);
    expect(loaded?.bdd).toEqual([
      {
        cwd: root,
        outputDir: path.join(root, '.features-gen'),
        features: ['test/features/**/*.feature'],
        steps: ['test/steps/**/*.ts'],
      },
    ]);
    // bddgen and Playwright, started after this, read their own configuration.
    expect(process.env.PLAYWRIGHT_BDD_CONFIGS).toBeUndefined();
  });

  // Steps are reported at their line in the feature file, and playwright-bdd's Cucumber
  // reporters look for them in the generated file: every step was "skipped".
  it('writes Cucumber reports in which the steps ran', () => {
    const root = path.resolve(__dirname, '../..');
    const report = path.join(
      fs.mkdtempSync(path.join(os.tmpdir(), 'plainwright-')),
      'cucumber.json',
    );
    const { PLAYWRIGHT_BDD_CONFIGS: _, ...env } = process.env;
    const run = spawnSync(
      process.execPath,
      [
        path.join(root, 'node_modules/jiti/lib/jiti-cli.mjs'),
        path.join(root, 'src/cli.ts'),
        'test',
      ],
      {
        cwd: path.join(__dirname, 'fixtures/reporter'),
        env: { ...env, CUCUMBER_JSON: report },
        encoding: 'utf8',
      },
    );
    expect(run.status, run.stdout + run.stderr).toBe(0);
    const [feature] = JSON.parse(fs.readFileSync(report, 'utf8'));
    const steps = feature.elements[0].steps.filter(
      (step: { keyword: string }) => step.keyword === '* ',
    );
    expect(
      steps.map((step: { name: string; result: { status: string } }) => [
        step.name,
        step.result.status,
      ]),
    ).toEqual([
      ['I remember "Coffee" as "item"', 'passed'],
      ['I remember "{item} with milk" as "order"', 'passed'],
    ]);
  }, 60_000);
});
