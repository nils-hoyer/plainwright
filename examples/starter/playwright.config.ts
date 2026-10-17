import { defineConfig } from '@nils.hoyer/plainwright/config';

// The example app in app/. To test your own app, set baseURL to it and remove webServer.
const port = 3210;

// Tests are in features/, your own sentences in keywords/, named pages in pages/.
// More options: https://github.com/nils-hoyer/plainwright/blob/main/docs/setup.md
export default defineConfig({
  // The app under test. Page addresses in pages/ are relative to it.
  baseURL: `http://localhost:${port}`,
  webServer: {
    command: 'node app/server.mjs',
    url: `http://localhost:${port}`,
    env: { PORT: String(port) },
    reuseExistingServer: !process.env.CI,
  },
});
