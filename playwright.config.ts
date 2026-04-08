import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

const testDir = defineBddConfig({
  features: 'test/features/**/*.feature',
  steps: ['test/steps/**/*.ts', 'src/steps/**/*.ts', 'test/fixtures.ts', 'src/fixtures/**/*.ts'],
  importTestFrom: 'test/fixtures.ts',
  disableWarnings: { importTestFrom: true },
});

export default defineConfig({
  testDir,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      // Exclude touch scenarios – they need hasTouch: true (chromium-touch project)
      grepInvert: /@touch/,
    },
    {
      name: 'chromium-touch',
      use: { ...devices['Desktop Chrome'], hasTouch: true },
      grep: /@touch/,
    },
  ],
});
