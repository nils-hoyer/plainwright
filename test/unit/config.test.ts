import path from 'node:path';
import { cucumberReporter as bddCucumberReporter } from 'playwright-bdd';
import { afterAll, describe, expect, it } from 'vitest';
import { cucumberReporter, defineConfig } from '../../src/config';

const plainwrightReporter = path.resolve(__dirname, '../../src/reporter.ts');

const before = process.env.PLAYWRIGHT_BDD_CONFIGS;
afterAll(() => {
  if (before === undefined) delete process.env.PLAYWRIGHT_BDD_CONFIGS;
  else process.env.PLAYWRIGHT_BDD_CONFIGS = before;
});

describe('defineConfig', () => {
  // playwright-bdd needs a separate output folder for each configuration in one process.
  it('stores screenshots to compare against next to the feature files', () => {
    expect(defineConfig({ bdd: { outputDir: '.gen-1' } }).snapshotDir).toBe('.');
    expect(defineConfig({ bdd: { outputDir: '.gen-2', featuresRoot: 'test' } }).snapshotDir).toBe(
      'test',
    );
    expect(defineConfig({ bdd: { outputDir: '.gen-3' }, snapshotDir: 'shots' }).snapshotDir).toBe(
      'shots',
    );
  });

  it("writes Cucumber reports with the steps found, with its own cucumberReporter or playwright-bdd's", () => {
    const json = cucumberReporter('json', { outputFile: 'reports/cucumber.json' });
    expect(json).toEqual([
      plainwrightReporter,
      { $type: 'json', outputFile: 'reports/cucumber.json' },
    ]);
    const { reporter } = defineConfig({
      bdd: { outputDir: '.gen-4' },
      reporter: [
        ['list'],
        ['junit', { outputFile: 'reports/junit.xml' }],
        bddCucumberReporter('html', { outputFile: 'reports/cucumber.html' }),
      ],
    });
    expect(reporter).toEqual([
      ['list'],
      ['junit', { outputFile: 'reports/junit.xml' }],
      [plainwrightReporter, { $type: 'html', outputFile: 'reports/cucumber.html' }],
    ]);
  });
});
