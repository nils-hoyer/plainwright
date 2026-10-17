<p align="center">
  <img src="docs/images/banner.svg" alt="Plainwright: browser tests as plain English sentences" width="720">
</p>

# Plainwright

[![npm](https://img.shields.io/npm/v/@nils.hoyer/plainwright)](https://www.npmjs.com/package/@nils.hoyer/plainwright)
[![CI](https://github.com/nils-hoyer/plainwright/actions/workflows/ci.yml/badge.svg)](https://github.com/nils-hoyer/plainwright/actions/workflows/ci.yml)
[![Sponsor](https://img.shields.io/github/sponsors/nils-hoyer?label=Sponsor&logo=GitHub)](https://github.com/sponsors/nils-hoyer)

Plainwright is built on [Playwright](https://playwright.dev/) and comes with more than 100
ready-made steps for what you do in a browser. You put these sentences together into tests, or
let an AI assistant do it, and anyone on the team can check what a test does, without
programming.

```gherkin
Feature: Orders

  Scenario: Delete an order
    * I open the url "/orders"
    * I click the "Delete" button in the "Order 1001" row
    * I see the "Order 1001 deleted" message
```

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
npm install --save-dev @nils.hoyer/plainwright playwright-bdd @playwright/test

# Install the browser
npx playwright install chromium
```

The minimal configuration is one file:

```ts
// playwright.config.ts
import { defineConfig } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';
import { steps } from '@nils.hoyer/plainwright';

export default defineConfig({
  testDir: defineBddConfig({
    features: 'features/**/*.feature',
    // Your own steps, if any, and Plainwright's ready-made steps
    steps: ['steps/**/*.ts', steps],
  }),
  use: {
    // The address of your app. "/login" in a test means http://localhost:3000/login
    baseURL: 'http://localhost:3000',
  },
});
```

```bash
# Add "npm test": it turns the feature files into Playwright tests and runs them
npm pkg set scripts.test="bddgen && playwright test"

# Run the tests
npm test
```

More options, such as the "Fix with AI" prompt and replays of failed tests, are in
[setup](docs/setup.md).

### Your first test

A test is a `.feature` file in `features/`:

```gherkin
Feature: Login

  Scenario: A wrong password shows an error
    * I open the url "/login"
    * I fill "jane@example.com" in the "Email" field
    * I fill "wrong" in the "Password" field
    * I click the "Log in" button
    * I see the text "Email or password is incorrect."
```

`Feature` names the area, `Scenario` is one test, and each `*` line is a step. The address
`"/login"` is relative to the address of your app. An element is its name on the screen followed
by its type: `the "Log in" button`.

All these steps are ready-made. The ones you will use most:

| To …                   | write                                            |
| ---------------------- | ------------------------------------------------ |
| open a page            | `I open the url "/login"`                        |
| click                  | `I click the "Log in" button`                    |
| type into a field      | `I fill "jane@example.com" in the "Email" field` |
| choose from a dropdown | `I select "Germany" in the "Country" dropdown`   |
| check a text           | `I see the text "Welcome back!"`                 |
| check a state          | `I see the "Log in" button is disabled`          |
| check where you are    | `I see the url "/dashboard"`                     |

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

    * I open the url "/login"
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
    * I open the url "/orders"
    * I click the "Delete" button in the "Order 1001" row
    * I see the "Order 1001 deleted" message
```

The report shows the four login steps nested under `I log in as …`, and `lint` and the editor
know the new sentence like any other. Files in `keywords/` load by themselves.

### Pages and test data

Name your pages with one small file each in `pages/`, so tests say `I open the "Orders" page`
and an address changes in one place:

```json
// pages/orders.json
{ "name": "Orders", "url": "/orders" }
```

Data that many tests share goes into JSON files in `data/`, and a step refers to it in braces
inside the quotes. Passwords come from environment variables or a `.env` file:

```gherkin
* I fill "{users.admin.email}" in the "Email" field
* I fill "{env.TEST_PASSWORD}" in the "Password" field
```

Data a test needs first, such as an order to refund, is a keyword that creates it through your
app's API and deletes it after the test:

```gherkin
Scenario: A paid order can be refunded
  Given there is an order for "Coffee"
  When I open the url "/orders/{order.id}"
  And I click the "Refund" button
  Then I see the "Order refunded" message
```

How to write that keyword, and everything else about pages and data, is in
[pages, test data and fixtures](docs/pages-and-data.md).

## Learn more

- [Setup](docs/setup.md): connect Plainwright to your app.
- [Pages, test data and fixtures](docs/pages-and-data.md): named pages, data files, secrets and
  test data created through your app's API.
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
