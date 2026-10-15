# Plainwright

[![npm](https://img.shields.io/npm/v/plainwright)](https://www.npmjs.com/package/plainwright)
[![CI](https://github.com/nils-hoyer/plainwright/actions/workflows/ci.yml/badge.svg)](https://github.com/nils-hoyer/plainwright/actions/workflows/ci.yml)
[![Sponsor](https://img.shields.io/github/sponsors/nils-hoyer?label=Sponsor&logo=GitHub)](https://github.com/sponsors/nils-hoyer)

**Browser tests as plain English sentences: written by you or by AI, reviewed without reading
code.**

Plainwright is built on [Playwright](https://playwright.dev/) and comes with more than 100
ready-made steps for what you do in a browser. You put these sentences together into tests, or
let an AI assistant do it, and anyone on the team can check what a test does.

```gherkin
Feature: Orders

  Scenario: Delete an order
    * I open the "Orders" page
    * I click the "Delete" button in the "Order 1001" row
    * I see the "Order 1001 deleted" message
```

- **Sentences instead of code.** Everything in quotes is data; the rest of the sentence is fixed.
- **Names as on the screen:** `the "Log in" button`, `the "Email" field`. No CSS selectors or
  test IDs in your tests.
- **Errors that say what is there:**
  `No "Sign in" button found. Buttons on this page: "Accept Cookies", "Log in".`
- **AI writes, you review.** An assistant gets the list of sentences and the names on a page;
  `lint` catches any sentence it made up.
- **Your own sentences without code.** Combine steps into a new sentence, written the same way.
- **Playwright's report and replay:** every step, screenshots of failures, and a step-by-step
  replay of the test.

**Who it is for:** teams where people who don't program write or review tests, teams that let AI
write tests that people check, and teams moving from Gauge or Robot Framework.

## Getting started

You need [Node.js](https://nodejs.org/) LTS and a terminal.

```bash
# Copy the starter project into the folder my-tests
npx degit nils-hoyer/plainwright/examples/starter my-tests
cd my-tests

# Install Plainwright, Playwright and the browser
npm install

# Run the tests against the todo app that comes with the starter
npm test

# Open the report of the last run
npm run report
```

To add Plainwright to an existing project instead:

```bash
# Install Plainwright, Playwright and playwright-bdd
npm install --save-dev plainwright playwright-bdd @playwright/test

# Install the browser
npx playwright install chromium
```

Then connect it to your app as described in [setup](docs/setup.md).

### Your first test

A test is a `.feature` file in `features/`:

```gherkin
Feature: Login

  Scenario: A wrong password shows an error
    * I open the "Login" page
    * I fill "jane@example.com" in the "Email" field
    * I fill "wrong" in the "Password" field
    * I click the "Log in" button
    * I see the text "Email or password is incorrect."
```

`Feature` names the area, `Scenario` is one test, and each `*` line is a step. An element is its
name on the screen followed by its type: `the "Log in" button`.

All these steps are ready-made. The ones you will use most:

| To …                        | write                                            |
| --------------------------- | ------------------------------------------------ |
| open a page                 | `I open the "Login" page`                        |
| click                       | `I click the "Log in" button`                    |
| type into a field           | `I fill "jane@example.com" in the "Email" field` |
| choose from a dropdown      | `I select "Germany" in the "Country" dropdown`   |
| check that something shows  | `I see the "Welcome" heading`                    |
| check a text                | `I see the text "Welcome back!"`                 |
| check what a field contains | `I see the value "Jane" in the "Name" field`     |
| check a state               | `I see the "Log in" button is disabled`          |

Every sentence is in the [step reference](docs/steps.md), and VS Code can suggest them while you
type ([editor support](docs/ide-support.md)).

### Your own sentences

Steps you repeat become a keyword: a new sentence made of existing steps, written in a feature
file in `keywords/`. The title is the new sentence, and each `"<name>"` in it is a value you
fill in when you use it.

```gherkin
# keywords/account.feature
Feature: Account

  Scenario Outline: I log in as "<username>" with password "<password>"
    Opens the login page and logs in.

    * I open the "Login" page
    * I fill "<username>" in the "Username" field
    * I fill "<password>" in the "Password" field
    * I click the "Log in" button

    Examples:
      | username | password |
      | jane     | secret   |
```

Any test can now use it like a built-in step:

```gherkin
# features/orders.feature
Feature: Orders

  Scenario: Delete an order
    * I log in as "jane" with password "secret"
    * I open the "Orders" page
    * I click the "Delete" button in the "Order 1001" row
    * I see the "Order 1001 deleted" message
```

The report shows the four login steps nested under `I log in as …`, and `lint` and the editor
know the new sentence like any other. The starter already loads everything in `keywords/`. For
what existing steps cannot do, such as calling an API, you can write steps in TypeScript: see
[your own steps](docs/writing-steps.md).

## Learn more

- [Setup](docs/setup.md): connect Plainwright to your app.
- [Logging in once](docs/logging-in.md): stay logged in across tests.
- [Step reference](docs/steps.md): every sentence with an example.
- [Editor support](docs/ide-support.md): suggestions for sentences in VS Code.
- [AI authoring](docs/ai-authoring.md): let an assistant write tests.
- [Reading tests](docs/reading-tests.md): one page for reviewers.
- [Commands](docs/commands.md): running tests, `lint`, `inspect`, `catalog` and more.
- [Your own steps](docs/writing-steps.md): keywords, steps in TypeScript, fixtures.
- [Vocabulary rules](docs/vocabulary.md): how sentences are worded.
- Coming from another tool: [Gauge](docs/migrating-from-gauge.md) ·
  [Robot Framework](docs/coming-from-robot-framework.md)

## Contributing

1. Open an issue that describes the problem and the expected behaviour. A new core step also
   needs an update to the [reviewer guide](docs/reading-tests.md).
2. Install dependencies with `npm ci` and the browser with `npx playwright install chromium`.
3. Make your change in `src/` (built-in steps in `src/steps/`), with tests: unit tests in
   `test/unit/`, feature files in `test/features/` against the app in `test/test-app/`.
4. Run `npm run verify` (format, types, generated docs, feature lint, unit and end-to-end tests).
   It must pass; `npm run docs` updates the generated docs.
5. Open a pull request with the implementation and tests. Its title appears in the release
   notes, so describe the change for users. Don't change the version in `package.json`: the
   maintainer releases from GitHub Actions, which increases it.

## License

[MIT](LICENSE)
