import path from 'node:path';
import { defineConfig as definePlaywrightConfig, devices } from '@playwright/test';
import type {
  PlaywrightTestConfig,
  PlaywrightTestProject,
  ReporterDescription,
} from '@playwright/test';
import {
  cucumberReporter as bddCucumberReporter,
  defineBddConfig,
  type BDDInputConfig,
} from 'playwright-bdd';
import { aiFixPromptTemplate } from './ai';
import { checkOptions, type KeywordsOptions } from './fixtures';
import { steps as builtInSteps } from './index';
import { SETUP_TAG } from './session';

export type PlainwrightConfig = PlaywrightTestConfig<KeywordsOptions> & {
  /** The address of your app. `"/login"` in a test means `<baseURL>/login`. */
  baseURL?: string;
  /** The tests. Default: `features/**\/*.feature`. */
  features?: string | string[];
  /** Your step files in TypeScript or JavaScript, if any. Default: `steps/**\/*.{ts,js}`. */
  steps?: string | string[];
  /** More playwright-bdd options, see https://vitalets.github.io/playwright-bdd/#/configuration/options. */
  bdd?: Omit<BDDInputConfig, 'features' | 'steps'>;
  /**
   * Runs the scenarios tagged `@setup` once, before all others, in a project named `setup`.
   * One that ends with `I keep the session` logs in for the other scenarios. Default: `false`.
   */
  setup?: boolean;
};

/**
 * The Playwright configuration for Plainwright tests, with the usual settings:
 *
 *   // playwright.config.ts
 *   import { defineConfig } from '@nils.hoyer/plainwright/config';
 *
 *   export default defineConfig({ baseURL: 'http://localhost:3000' });
 *
 * Feature files in `features/`, your steps (if any) in `steps/`, Chromium, a click or fill
 * that finds nothing fails after 10 s, replays of failed tests and a "Fix with AI" prompt in the
 * report. Every Playwright option can be added or changed: `webServer`, `projects`, `use`, ….
 */
export function defineConfig(
  config: PlainwrightConfig = {},
): PlaywrightTestConfig<KeywordsOptions> {
  const { baseURL, features, steps, bdd, use, reporter, setup, projects, ...playwright } = config;
  for (const options of [use, ...(projects ?? []).map((project) => project.use)]) {
    checkOptions(options);
  }
  const testDir = defineBddConfig({
    aiFix: { promptAttachment: true, promptTemplate: aiFixPromptTemplate },
    ...bdd,
    features: features ?? 'features/**/*.feature',
    steps: [...[steps ?? 'steps/**/*.{ts,js}'].flat(), builtInSteps],
  });
  return definePlaywrightConfig<KeywordsOptions>({
    testDir,
    // The report opens by itself when a test fails (not in CI). Its "Fix with AI" attachment
    // asks to fix the scenario; Playwright's own "Copy prompt" would ask for code.
    reporter: reporter ? withCucumberFix(reporter) : [['list'], ['html', { noCopyPrompt: true }]],
    // Screenshots to compare against are stored next to the feature files, so they can be
    // committed: features/login.feature.spec.js-snapshots/. Playwright's default is next to
    // the generated tests, a folder that is not committed.
    snapshotDir: bdd?.featuresRoot ?? '.',
    ...playwright,
    projects: withSetup(
      setup,
      projects ?? [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
      playwright.grepInvert,
    ),
    use: {
      // A click or fill that finds nothing fails after 10 s and lists what the page offers.
      actionTimeout: 10_000,
      trace: 'retain-on-failure',
      ...(baseURL ? { baseURL } : {}),
      ...use,
    },
  });
}

/** Plainwright's wrapper of playwright-bdd's Cucumber reporters, see src/reporter.ts. */
const CUCUMBER_REPORTER = path.join(__dirname, `reporter${path.extname(__filename)}`);
const BDD_CUCUMBER_REPORTER = bddCucumberReporter('json')[0];

/**
 * A Cucumber report: `json` or `junit` for CI servers and test management tools, `html` for
 * people. Takes the options of playwright-bdd's cucumberReporter(), which marks every step
 * "skipped" in tests that run with `plainwright test`:
 *
 *   reporter: [['list'], ['html'], cucumberReporter('json', { outputFile: 'reports/cucumber.json' })]
 */
export const cucumberReporter: typeof bddCucumberReporter = (type, options) => [
  CUCUMBER_REPORTER,
  bddCucumberReporter(type, options)[1],
];

/** The reporters, with playwright-bdd's Cucumber reporters replaced by Plainwright's. */
function withCucumberFix(reporter: string | ReporterDescription[]): string | ReporterDescription[] {
  if (typeof reporter === 'string') return reporter;
  return reporter.map((entry) =>
    entry[0] === BDD_CUCUMBER_REPORTER ? [CUCUMBER_REPORTER, entry[1]] : entry,
  );
}

/**
 * With `setup: true`, a project that runs the `@setup` scenarios, in the browser of the first
 * project, and every project after it without them. A project's `grepInvert` replaces the one of
 * the configuration, so that one is kept where a project has none.
 */
function withSetup<T>(
  setup: boolean | undefined,
  projects: PlaywrightTestProject<T>[],
  grepInvert: PlaywrightTestConfig['grepInvert'],
) {
  if (!setup) return projects;
  if (projects.some((project) => project.name === 'setup')) {
    throw new Error(
      '[plainwright] setup: true adds a project named "setup", and the configuration has one ' +
        'already. Rename yours, or remove setup: true and run your own.',
    );
  }
  // The tag itself, not tags that start with it such as @setup-data. Playwright matches against
  // the title and the tags, separated by spaces.
  const tag = new RegExp(`(?<!\\S)${SETUP_TAG}(?!\\S)`);
  // Playwright refuses dependencies for a project that runs after others (`teardown`).
  const teardowns = new Set(projects.flatMap((project) => project.teardown ?? []));
  return [
    { name: 'setup', grep: tag, use: projects[0]?.use },
    ...projects.map((project) => ({
      ...project,
      ...(project.name && teardowns.has(project.name)
        ? {}
        : { dependencies: [...(project.dependencies ?? []), 'setup'] }),
      grepInvert: [...[project.grepInvert ?? grepInvert ?? []].flat(), tag],
    })),
  ];
}
