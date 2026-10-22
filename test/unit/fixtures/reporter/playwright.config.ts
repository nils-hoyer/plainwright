import { cucumberReporter } from 'playwright-bdd';
import { defineConfig } from '../../../../src/config';

// playwright-bdd's own cucumberReporter, as its docs show it: defineConfig() puts
// Plainwright's in its place.
export default defineConfig({
  features: '*.feature',
  reporter: [cucumberReporter('json', { outputFile: process.env.CUCUMBER_JSON })],
});
