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

## Email codes and two-factor login

Some apps send a code by email or ask for one from an authenticator app after the password. In
order of preference:

1. **A test account without the second step.** Ask the developers for one in the test
   environment. It is the simplest way and the most common one.
2. **A code by email.** The test environment sends its emails to a test mailbox with an API,
   such as [Mailpit](https://mailpit.axllent.org/) on your machine or in CI, or a service such as
   Mailosaur. The keyword reads the newest email and takes the code out of its text:

   ```gherkin
   # keywords/account.feature
   Scenario Outline: I am logged in with an email code as "<email>"
     * I open the url "/login"
     * I fill the fields:
       | Email    | <email>             |
       | Password | {env.TEST_PASSWORD} |
     * I click the "Log in" button
     * I see the text "We sent you a code"
     * I send a "GET" request to "http://localhost:8025/api/v1/message/latest"
     * I remember the number in "{response.Text}" as "code"
     * I fill "{code}" in the "Code" field
     * I click the "Confirm" button
     * I see the url "/dashboard"

     Examples:
       | email            |
       | jane@example.com |
   ```

   `/api/v1/message/latest` is Mailpit's newest message, and `Text` its text. `I remember the
number in` takes the first number of the text, so put the code before any other number in the
   email of the test environment, or take it out with a step of your own. Another mailbox has
   its own address and field names in its API docs. When several tests log in at the same time,
   give each its own address, such as `test-{unique}@example.com`, and search the mailbox for
   it.

3. **A code from an authenticator app.** The app makes the code from a secret that the account
   shows once, as a QR code, when two-factor login is turned on. Keep that secret in
   `{env.TOTP_SECRET}`; a developer writes a step that makes the code from it, see
   [codes from an authenticator app](writing-steps.md#codes-from-an-authenticator-app). The code
   counts as a secret and shows as `(hidden)` in the report.

   ```gherkin
   * I remember the authenticator code for "{env.TOTP_SECRET}" as "code"
   * I fill "{code}" in the "Code" field
   ```

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
