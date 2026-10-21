import { defineConfig as definePlaywrightConfig, devices } from '@playwright/test';
import type { PlaywrightTestConfig } from '@playwright/test';
import { defineBddConfig, type BDDInputConfig } from 'playwright-bdd';
import { aiFixPromptTemplate } from './ai';
import type { KeywordsOptions } from './fixtures';
import { steps as builtInSteps } from './index';

export type PlainwrightConfig = PlaywrightTestConfig<KeywordsOptions> & {
  /** The address of your app. `"/login"` in a test means `<baseURL>/login`. */
  baseURL?: string;
  /** The tests. Default: `features/**\/*.feature`. */
  features?: string | string[];
  /** Your step files in TypeScript or JavaScript, if any. Default: `steps/**\/*.{ts,js}`. */
  steps?: string | string[];
  /** More playwright-bdd options, see https://vitalets.github.io/playwright-bdd/#/configuration/options. */
  bdd?: Omit<BDDInputConfig, 'features' | 'steps'>;
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
  const { baseURL, features, steps, bdd, use, ...playwright } = config;
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
    reporter: [['list'], ['html', { noCopyPrompt: true }]],
    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
    // Screenshots to compare against are stored next to the feature files, so they can be
    // committed: features/login.feature.spec.js-snapshots/. Playwright's default is next to
    // the generated tests, a folder that is not committed.
    snapshotDir: bdd?.featuresRoot ?? '.',
    ...playwright,
    use: {
      // A click or fill that finds nothing fails after 10 s and lists what the page offers.
      actionTimeout: 10_000,
      trace: 'retain-on-failure',
      ...(baseURL ? { baseURL } : {}),
      ...use,
    },
  });
}
