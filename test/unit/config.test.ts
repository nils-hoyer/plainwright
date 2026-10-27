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

  it('runs the @setup scenarios first with setup: true, in the browser of the first project', () => {
    const chrome = { defaultBrowserType: 'chromium' };
    expect(defineConfig({ bdd: { outputDir: '.gen-5' }, setup: true }).projects).toEqual([
      { name: 'setup', grep: /(?<!\S)@setup(?!\S)/, use: expect.objectContaining(chrome) },
      {
        name: 'chromium',
        use: expect.objectContaining(chrome),
        dependencies: ['setup'],
        grepInvert: [/(?<!\S)@setup(?!\S)/],
      },
    ]);
    const { projects } = defineConfig({
      bdd: { outputDir: '.gen-6' },
      setup: true,
      projects: [
        { name: 'firefox', use: { browserName: 'firefox' }, grepInvert: /@mobile/ },
        { name: 'phone', grep: /@mobile/, dependencies: ['seed'] },
      ],
    });
    expect(
      projects?.map(({ name, use, grep, grepInvert, dependencies }) => ({
        name,
        use,
        grep,
        grepInvert,
        dependencies,
      })),
    ).toEqual([
      { name: 'setup', use: { browserName: 'firefox' }, grep: /(?<!\S)@setup(?!\S)/ },
      {
        name: 'firefox',
        use: { browserName: 'firefox' },
        grepInvert: [/@mobile/, /(?<!\S)@setup(?!\S)/],
        dependencies: ['setup'],
      },
      {
        name: 'phone',
        grep: /@mobile/,
        grepInvert: [/(?<!\S)@setup(?!\S)/],
        dependencies: ['seed', 'setup'],
      },
    ]);
    // The tag, not tags that start with it or text that contains it.
    const grep = projects![0].grep as RegExp;
    expect(grep.test('Log in once Log in @setup')).toBe(true);
    expect(grep.test('Seed @setup-data')).toBe(false);
    expect(grep.test('Log in as admin@setup.com')).toBe(false);
  });

  it('keeps the grepInvert of the configuration, and adds no dependency to a teardown', () => {
    const { projects } = defineConfig({
      bdd: { outputDir: '.gen-8' },
      setup: true,
      grepInvert: /@wip/,
      projects: [
        { name: 'chromium', teardown: 'cleanup' },
        { name: 'cleanup', grep: /@cleanup/ },
        { name: 'firefox', grepInvert: /@slow/ },
      ],
    });
    expect(
      projects?.map(({ name, grepInvert, dependencies }) => ({ name, grepInvert, dependencies })),
    ).toEqual([
      { name: 'setup', grepInvert: undefined, dependencies: undefined },
      { name: 'chromium', grepInvert: [/@wip/, /(?<!\S)@setup(?!\S)/], dependencies: ['setup'] },
      { name: 'cleanup', grepInvert: [/@wip/, /(?<!\S)@setup(?!\S)/], dependencies: undefined },
      { name: 'firefox', grepInvert: [/@slow/, /(?<!\S)@setup(?!\S)/], dependencies: ['setup'] },
    ]);
  });

  it('refuses setup: true next to a project named setup', () => {
    expect(() =>
      defineConfig({ bdd: { outputDir: '.gen-7' }, setup: true, projects: [{ name: 'setup' }] }),
    ).toThrow('setup: true adds a project named "setup"');
  });
});
