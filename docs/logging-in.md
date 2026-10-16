# Logging in once

Most scenarios of a real app start logged in. Logging in through the form in every scenario is
slow and repeats the same steps everywhere. Playwright can log in once per run, save the
browser session (cookies and local storage) to a file, and start other tests with it. This
works with Plainwright unchanged, because the tests run on the Playwright runner.

This repository runs the example below in its own test suite: see `test/setup/login.setup.ts`,
`test/features/logged-in.feature` and the projects in `playwright.config.ts`.

## 1. A setup file that logs in

The setup is plain Playwright code. It runs once per run, before the scenarios that need it,
and reviewers do not need to read it.

```ts
// setup/login.setup.ts
import { expect, test as setup } from '@playwright/test';

setup('log in', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Username').fill(process.env.TEST_USER!);
  await page.getByLabel('Password').fill(process.env.TEST_PASSWORD!);
  await page.getByRole('button', { name: 'Log in' }).click();
  // Wait until the app shows that the login worked, then save the session.
  await expect(page.getByText('Signed in as')).toBeVisible();
  await page.context().storageState({ path: 'playwright/.auth/user.json' });
});
```

Keep the session file out of git: add `playwright/.auth/` to `.gitignore`. Take the password
from the environment or your CI secrets, not from the code.

## 2. Projects that use the session

`defineBddConfig()` puts the generated tests into `testDir`. The setup project overrides
`testDir`, so it only runs the setup file. A second project depends on it and starts every test
with the saved session.

```ts
// playwright.config.ts
export default defineConfig({
  testDir, // from defineBddConfig()
  use: { baseURL: 'http://localhost:3000' },
  projects: [
    { name: 'setup', testDir: 'setup', testMatch: /\.setup\.ts$/ },
    {
      name: 'logged-in',
      use: { ...devices['Desktop Chrome'], storageState: 'playwright/.auth/user.json' },
      dependencies: ['setup'],
      grepInvert: /@logged-out/,
    },
    {
      name: 'logged-out',
      use: { ...devices['Desktop Chrome'] },
      grep: /@logged-out/,
    },
  ],
});
```

Scenarios now start logged in. Scenarios that test the login itself are tagged `@logged-out`
and run in a fresh browser:

```gherkin
@logged-out
Feature: Login

  Scenario: A wrong password shows an error
    * I open the "Login" page
    * I fill "1234567890" in the "Username" field
    …
```

If only some features need the session, turn it around as this repository does: tag those
`@logged-in`, give the `logged-in` project `grep: /@logged-in/` and the default project
`grepInvert: /@logged-in/`.

## Several users

Save one file per user (`playwright/.auth/admin.json`, `playwright/.auth/customer.json`) from
one setup file with two `setup()` tests, and add one project per user with its own `grep`
tag (`@admin`, `@customer`). Step files in a folder named after the same tag
(`steps/@admin/`) then only apply to that user's scenarios.

## Inspecting pages behind the login

`inspect` takes the same session, so it lists the elements a logged-in user sees:

```bash
npx playwright test --project setup
npx plainwright inspect "Dashboard" \
  --base-url http://localhost:3000 --storage-state playwright/.auth/user.json
```

The session is saved for the address it was made on: use the same `--base-url` as the tests.
