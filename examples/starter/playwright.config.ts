import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';
import { aiFixPromptTemplate, steps } from '@nils.hoyer/plainwright';

// The example app in app/. To test your own app, set baseURL to it and remove webServer.
const port = 3210;

const testDir = defineBddConfig({
  features: 'features/**/*.feature',
  // Steps in TypeScript, if you ever need them, and Plainwright's ready-made steps.
  steps: ['steps/**/*.ts', steps],
  // Failed tests get a "Fix with AI" prompt in the report.
  aiFix: { promptAttachment: true, promptTemplate: aiFixPromptTemplate },
});

export default defineConfig({
  testDir,
  // The report opens by itself when a test fails (not in CI); npm run report opens it anytime.
  reporter: [['list'], ['html']],
  use: {
    // The app under test. Page addresses in pages.json are relative to it.
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
