# Logging in

Most scenarios of a real app start logged in. Write the login once, as a
[keyword](keywords.md), and put it into the `Background:` of every feature that needs it. Each
scenario then logs in before its own steps, and the reviewer sees at the top of the file who is
logged in. No code and no configuration.

## 1. A keyword that logs in

The keyword fills the login form and ends with a check of where the login leads, so the next
step does not start while the app is still logging in.

```gherkin
# keywords/account.feature
Feature: Account

  Scenario Outline: I am logged in as "<email>"
    Logs in with the test password and waits for the dashboard.

    * I open the url "/login"
    * I fill "<email>" in the "Email" field
    * I fill "{env.TEST_PASSWORD}" in the "Password" field
    * I click the "Log in" button
    * I see the url "/dashboard"

    Examples:
      | email            |
      | jane@example.com |
```

Take the password from the environment, a `.env` file or your CI secrets, as in
[test data](test-data.md#passwords-and-other-secrets).

## 2. The keyword in the Background

`Background:` steps run before every scenario of the file.

```gherkin
# features/orders.feature
Feature: Orders

  Background:
    * I am logged in as "jane@example.com"

  Scenario: Delete an order
    * I open the url "/orders"
    * I click the "Delete" button in the "Order 1001" row
    * I see the "Order 1001 deleted" message
```

## Several users

Write the user into the step: `I am logged in as "{users.admin.email}"` in the features of the
admin, `I am logged in as "{users.customer.email}"` in the others, with the users in a
[data file](test-data.md#data-files). A scenario that needs another user than the rest of the
file logs in at its own start, in a feature without a `Background`, or in a feature of its own.

## Scenarios that test the login itself

They go into a feature without the login in its `Background`, such as `features/login.feature`,
and start with a fresh browser like every scenario.

## When logging in every test is too slow

Logging in through the form takes a second or two per scenario. For a large suite, a developer
can log in once per run with Playwright's own setup project and give every scenario the saved
session: see [authentication](https://playwright.dev/docs/auth) in Playwright's docs. The feature
files stay the same, without the login in the `Background`. The session file holds a logged-in
session, so it must never be committed: `init` adds `playwright/.auth/` to `.gitignore`.

`inspect` takes such a session too, so it lists the elements a logged-in user sees:

```bash
npx plainwright inspect "Dashboard" --storage-state playwright/.auth/user.json
```
