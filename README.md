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
programming. Unlike Cucumber, you write no code behind the steps: they exist already, find
elements by what the user sees, and run on the Playwright runner with its report and traces.

```gherkin
Feature: Orders

  Scenario: Delete an order
    * I open the url "/orders"
    * I click the "Delete" button in the "Order 1001" row
    * I see the "Order 1001 deleted" message
```

## Getting started

You need [Node.js](https://nodejs.org/) LTS and a terminal. In an empty folder, or in your
project:

```bash
npx @nils.hoyer/plainwright@latest init
```

It asks for the address of your app and which AI assistant you use, installs Plainwright,
Playwright and the browser, and writes a first test that checks what your app's start page shows.
Then:

```bash
# Run the tests
npm test

# Open the report of the last run
npm run report
```

In an existing project, `init` overwrites no file and says what it left out. To set everything
up by hand instead, see [setup](docs/setup.md).

Open the folder in VS Code and install the Cucumber extension when VS Code suggests it. It
suggests steps while you type and marks steps that don't exist. More in
[editor support](docs/ide-support.md).

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

Every step is in the [step reference](docs/steps.md). How tests are built, how elements are
found and how checks wait is in [writing tests](docs/writing-tests.md).

### Keywords: your own steps

Steps you repeat become a keyword: your own step, made of existing steps, written in a feature
file in `keywords/`. The title is the new step, and each `"<name>"` in it is a value you fill
in when you use it.

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
know the new step like any other. Files in `keywords/` load by themselves. More in
[keywords](docs/keywords.md).

### Pages

Give your pages a name, one small file each in `pages/`. An address then changes in one place,
and an element without a visible name, such as a search field without a label, gets one:

```json
// pages/orders.json
{
  "name": "Orders",
  "url": "/orders",
  "elements": { "Search": "[data-testid=search]" }
}
```

Tests use the names, and the selector stays in the page file:

```gherkin
* I open the "Orders" page
* I fill "1001" in the "Search" field
* I see the text "Order 1001"
```

More in [pages](docs/pages.md).

### Test data

Data that many tests share goes into JSON files in `data/`:

```json
// data/users.json
{ "admin": { "email": "admin@example.com" } }
```

A step refers to it in braces inside the quotes. Passwords come from environment variables or a
`.env` file:

```gherkin
* I fill "{users.admin.email}" in the "Email" field
* I fill "{env.TEST_PASSWORD}" in the "Password" field
```

Data a test needs first, such as an order to refund, can be created through your app's API and
deleted after the test. How, and everything else about data, is in [test data](docs/test-data.md).

## Learn more

**Write tests**

- [Writing tests](docs/writing-tests.md): scenarios, elements, checks, tags.
- [Pages](docs/pages.md): named pages, and names for elements that have none.
- [Test data](docs/test-data.md): data files, passwords, data created through your app's API.
- [Keywords](docs/keywords.md): your own steps, made of existing steps.
- [AI authoring](docs/ai-authoring.md): let an assistant write tests.

**Review tests**

- [Reading tests](docs/reading-tests.md): one page for reviewers, about tests and the report.

**Set up and run**

- [Setup](docs/setup.md): what `init` wrote, the configuration, other environments, CI.
- [Logging in once](docs/logging-in.md): start tests logged in.
- [Commands](docs/commands.md): running tests, `lint`, `inspect`, `catalog` and more.
- [Editor support](docs/ide-support.md): suggestions for steps in VS Code.

**Extend**

- [Steps in TypeScript](docs/writing-steps.md): your own steps in code, fixtures.

**Reference**

- [Step reference](docs/steps.md): every step with an example.
- [Vocabulary rules](docs/vocabulary.md): how steps are worded.
- [Versioning](docs/versioning.md): what counts as a breaking change, before and after 1.0.

**Coming from another tool:** [Gauge](docs/migrating-from-gauge.md) ·
[Robot Framework](docs/coming-from-robot-framework.md)

## Contributing

Issues and pull requests are welcome: see [contributing](CONTRIBUTING.md).

## License

[MIT](LICENSE)
