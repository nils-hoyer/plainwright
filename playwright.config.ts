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
  // The @setup scenarios in test/features/setup.feature log in once (docs/logging-in.md).
  setup: true,
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      // Touch scenarios need a browser with touch enabled, see chromium-touch.
      grepInvert: /@touch/,
    },
    {
      name: 'chromium-touch',
      use: { ...devices['Desktop Chrome'], hasTouch: true },
      grep: /@touch/,
    },
  ],
});
