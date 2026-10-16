import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';
import { aiFixPromptTemplate } from '@nils.hoyer/plainwright';

// The example app in app/. To test your own app, set baseURL to it and remove webServer.
const port = 3210;

const testDir = defineBddConfig({
  features: 'features/**/*.feature',
  steps: 'steps/**/*.ts',
  // Failed tests get a "Fix with AI" prompt in the report.
  aiFix: { promptAttachment: true, promptTemplate: aiFixPromptTemplate },
});

export default defineConfig({
  testDir,
  // The report opens by itself when a test fails (not in CI); npm run report opens it anytime.
  reporter: [['list'], ['html']],
  use: {
    // The app under test. Page addresses in steps/pages.ts are relative to it.
    baseURL: `http://localhost:${port}`,
    // A click or fill that finds nothing fails after 10 s and lists what the page offers.
    actionTimeout: 10_000,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'node app/server.mjs',
    url: `http://localhost:${port}`,
    env: { PORT: String(port) },
    reuseExistingServer: !process.env.CI,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
