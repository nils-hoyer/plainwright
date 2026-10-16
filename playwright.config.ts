import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';
import { aiFixPromptTemplate, type KeywordsOptions } from './src/index';

const port = 3123;
// Read by "{env.PLAINWRIGHT_TEST_PASSWORD}" in test/features/data.feature.
process.env.PLAINWRIGHT_TEST_PASSWORD ??= 'password123';

const testDir = defineBddConfig({
  features: 'test/features/**/*.feature',
  steps: 'test/steps/**/*.ts',
  // Failed tests get a prompt attachment for AI assistants in the report.
  aiFix: { promptAttachment: true, promptTemplate: aiFixPromptTemplate },
});

export default defineConfig<KeywordsOptions>({
  testDir,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  // Baselines for "matches the screenshot" steps. The swatch page has no text, so one
  // baseline works on every operating system.
  snapshotPathTemplate: 'test/snapshots/{arg}{ext}',
  use: {
    baseURL: `http://localhost:${port}`,
    // Fail a click or fill after 10 s, so the error can list what the page offers.
    actionTimeout: 10_000,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'node test/server.mjs',
    url: `http://localhost:${port}/login.html`,
    env: { PORT: String(port) },
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    // Logs in once and saves the session for chromium-logged-in (docs/logging-in.md).
    { name: 'setup', testDir: 'test/setup', testMatch: /\.setup\.ts$/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      // Touch scenarios need a browser with touch enabled, see chromium-touch.
      grepInvert: /@touch|@logged-in/,
    },
    {
      name: 'chromium-logged-in',
      use: { ...devices['Desktop Chrome'], storageState: 'playwright/.auth/user.json' },
      dependencies: ['setup'],
      grep: /@logged-in/,
    },
    {
      name: 'chromium-touch',
      use: { ...devices['Desktop Chrome'], hasTouch: true },
      grep: /@touch/,
    },
  ],
});
