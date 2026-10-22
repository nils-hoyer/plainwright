# Logging in once

Most scenarios of a real app start logged in. Logging in through the form in every scenario is
slow and repeats the same steps everywhere. Plainwright can log in once per run, in a scenario
of its own, keep the browser's session (its cookies and storage), and start every other
scenario with it. It takes a feature file, one step and one line in the configuration; no code.

## 1. A scenario that logs in

Scenarios tagged `@setup` run once, before all others. One of them logs in, with the steps or
the [keyword](keywords.md) your tests already use, and ends with `I keep the session`. Its last
step before that checks that the app has logged in, such as `I see the url "/dashboard"`, so the
session is kept once the login is done. Take the password from the environment, a `.env` file or
your CI secrets, as in [test data](test-data.md).

```gherkin
# features/setup.feature
@setup
Feature: Log in once

  Scenario: Log in
    * I log in as "{users.tester.email}" with password "{env.TEST_PASSWORD}"
    * I keep the session
```

## 2. Turn it on

`setup: true` in `playwright.config.ts` runs the `@setup` scenarios in a project of their own,
named `setup`, and lets the other projects wait for it. Running one feature file or one tag
(`npm test -- orders`) still runs the setup first.

```ts
import { defineConfig } from '@nils.hoyer/plainwright/config';

export default defineConfig({
  baseURL: 'http://localhost:3000',
  setup: true,
});
```

## 3. Scenarios that test the login

Every scenario now starts logged in. Scenarios that test the login itself are tagged
`@logged-out` and start with a fresh browser.

```gherkin
@logged-out
Feature: Login

  Scenario: A wrong password shows an error
    * I open the "Login" page
    * I fill "jane@example.com" in the "Email" field
    …
```

## Several users

Each user gets a setup scenario of their own, and the session is kept for a tag:
`I keep the session for "@admin" scenarios`. Scenarios tagged `@admin` then start as the admin,
all others with the session `I keep the session` kept. Without `I keep the session`, only the
scenarios with such a tag start logged in. Steps that only one user needs go into a folder named
after the tag, such as `steps/@admin/` (see [steps in TypeScript](writing-steps.md)).

```gherkin
@setup
Feature: Log in once

  Scenario: Customer
    * I log in as "{users.customer.email}" with password "{env.CUSTOMER_PASSWORD}"
    * I keep the session

  Scenario: Admin
    * I log in as "{users.admin.email}" with password "{env.ADMIN_PASSWORD}"
    * I keep the session for "@admin" scenarios
```

## Other browsers and phones

The setup runs once, in the browser of the first project, and every project starts with its
sessions. The `projects` from [other browsers and phones](setup.md#other-browsers-and-phones)
work unchanged with `setup: true`.

## Where the sessions are

`I keep the session` writes `playwright/.auth/session.json`, and `I keep the session for
"@admin" scenarios` writes `playwright/.auth/@admin.json`. They hold a logged-in session, so they
must never be committed: `init` adds the folder to `.gitignore`. Every run logs in again. To run
the tests with the sessions of the last run, without the setup, add `--no-deps`:
`npm test -- --no-deps`.

## Inspecting pages behind the login

`inspect` takes a session too, so it lists the elements a logged-in user sees. Run the setup
once, then name the session file:

```bash
npm test -- --project setup
npx plainwright inspect "Dashboard" --storage-state playwright/.auth/session.json
```

## With your own Playwright configuration

Without `defineConfig()`, add the two projects yourself. The steps and `@logged-out` work the
same, since they come with Plainwright's steps.

```ts
projects: [
  { name: 'setup', grep: /@setup/, use: { ...devices['Desktop Chrome'] } },
  {
    name: 'chromium',
    use: { ...devices['Desktop Chrome'] },
    dependencies: ['setup'],
    grepInvert: /@setup/,
  },
],
```

A setup file in TypeScript, as [Playwright's docs](https://playwright.dev/docs/auth) show it,
keeps working: a scenario starts with the `storageState` of its project unless
`I keep the session` kept one for it.
