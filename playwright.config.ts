import { devices } from '@playwright/test';
import { defineConfig } from './src/config';

const port = 3123;
// Read by "{env.PLAINWRIGHT_TEST_PASSWORD}" in test/features/data.feature.
process.env.PLAINWRIGHT_TEST_PASSWORD ??= 'password123';

// The configuration helper projects use (docs/setup.md), with the folders of this repository.
export default defineConfig({
  baseURL: `http://localhost:${port}`,
  features: 'test/features/**/*.feature',
  steps: 'test/steps/**/*.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  // Baselines for "matches the screenshot" steps. The swatch page has no text, so one
  // baseline works on every operating system.
  snapshotPathTemplate: 'test/snapshots/{arg}{ext}',
  use: { screenshot: 'only-on-failure' },
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
