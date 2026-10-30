<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/images/wordmark-dark.png">
    <img src="docs/images/wordmark-light.png" alt="Plainwright" height="44">
  </picture>
</p>

<p align="center">Browser tests as plain English sentences</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@nils.hoyer/plainwright"><img src="https://img.shields.io/npm/v/@nils.hoyer/plainwright" alt="npm"></a>
  <a href="https://github.com/nils-hoyer/plainwright/actions/workflows/ci.yml"><img src="https://github.com/nils-hoyer/plainwright/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/sponsors/nils-hoyer"><img src="https://img.shields.io/github/sponsors/nils-hoyer?label=Sponsor&logo=GitHub" alt="Sponsor"></a>
</p>

Plainwright is built on [Playwright](https://playwright.dev/) and comes with 35 everyday steps
for what you do in a browser, and more for special cases. You put these sentences together into
tests, or let an AI assistant do it, and anyone on the team can check what a test does, without
programming.

```gherkin
Feature: Orders

  Scenario: Delete an order
    * I open the url "/orders"
    * I click the "Delete" button in the "Order 1001" row
    * I see the "Order 1001 deleted" message
```

## Getting started

### Project setup

You need [Node.js](https://nodejs.org/) LTS and a terminal. Run `init` in an empty folder or in
your project: it asks for the address of your app and which AI assistant you use, installs
Plainwright, Playwright and the browser, writes a first test that checks what your app's start
page shows, and offers to run it. In an existing project it overwrites no file and says what it
left out. To set everything up by hand, or to try an example project first, see
[setup](docs/setup.md).

```bash
# Set up the project
npx @nils.hoyer/plainwright@latest init

# Run the tests
npm test

# Open the report of the last run
npm run report
```

### Editor setup

Open the folder in VS Code and install the Cucumber extension when VS Code suggests it. It
suggests steps while you type and marks steps that don't exist; `init` has already written the
settings it needs. More in [editor support](docs/ide-support.md). For IntelliJ IDEA, WebStorm,
Neovim and other editors, see [other editors](docs/other-editors.md).

## Your first test

A test is a `.feature` file in `features/`. `Feature` names the area, `Scenario` is one test, and
each `*` line is a step. The address `"/login"` is relative to the address of your app. An
element is its name on the screen followed by its type: `the "Log in" button`. All these steps
are ready-made; the table below has the ones you will use most, and every step is in the
[step reference](docs/steps.md). How tests are built, how elements are found and how checks wait
is in [writing tests](docs/writing-tests.md).

```gherkin
Feature: Login

  Scenario: A wrong password shows an error
    * I open the url "/login"
    * I fill "jane@example.com" in the "Email" field
    * I fill "wrong" in the "Password" field
    * I click the "Log in" button
    * I see the text "Email or password is incorrect."
```

| To …                   | write                                            |
| ---------------------- | ------------------------------------------------ |
| open a page            | `I open the url "/login"`                        |
| click                  | `I click the "Log in" button`                    |
| type into a field      | `I fill "jane@example.com" in the "Email" field` |
| choose from a dropdown | `I select "Germany" in the "Country" dropdown`   |
| check a text           | `I see the text "Welcome back!"`                 |
| check a state          | `I see the "Log in" button is disabled`          |
| check where you are    | `I see the url "/dashboard"`                     |

## Going further (optional)

A test needs none of this, but once tests repeat the same steps, addresses or values, keywords,
pages and test data keep each in one place, as good test suites do: a change in the app then
means one change in the tests, and the suite stays easy to maintain and extend.

### Keywords: your own steps

Steps you repeat become a keyword: your own step, made of existing steps, written in a feature
file in `keywords/`. The title is the new step, and each `"<name>"` in it is a value you fill in
when you use it. Files in `keywords/` load by themselves, and any test can then use the keyword
like a built-in step. The report shows the login steps nested under `I log in as …`. The last
step waits until the app has logged in, so the next step does not start too early. The editor
suggests the new step after the next `npm test` or `npm run lint`.
More in [keywords](docs/keywords.md).

```gherkin
# keywords/account.feature
Feature: Account

  Scenario Outline: I log in as "<email>" with password "<password>"
    Opens the login page, logs in and waits for the dashboard.

    * I open the url "/login"
    * I fill "<email>" in the "Email" field
    * I fill "<password>" in the "Password" field
    * I click the "Log in" button
    * I see the url "/dashboard"

    Examples:
      | email            | password |
      | jane@example.com | secret   |
```

```gherkin
# features/orders.feature
Feature: Orders

  Scenario: Delete an order
    * I log in as "jane@example.com" with password "secret"
    * I open the url "/orders"
    * I click the "Delete" button in the "Order 1001" row
    * I see the "Order 1001 deleted" message
```

### Pages

Give your pages a name, one small file each in `pages/`. An address then changes in one place,
and an element without a visible name, such as a search field without a label, gets one. Tests
use the names, and the selector stays in the page file. More in [pages](docs/pages.md).

```json
// pages/orders.json
{
  "name": "Orders",
  "url": "/orders",
  "elements": {
    "Search": "[data-testid=search]"
  }
}
```

```gherkin
* I open the "Orders" page
* I fill "1001" in the "Search" field
* I see the text "Order 1001"
```

### Test data

Data that many tests share goes into JSON files in `data/`. A step refers to it in braces inside
the quotes, and passwords come from environment variables or a `.env` file. Data a test needs
first, such as an order to refund, can be created through your app's API and deleted after the
test. How, and everything else about data, is in [test data](docs/test-data.md).

```json
// data/users.json
{
  "admin": {
    "email": "admin@example.com"
  }
}
```

```gherkin
* I fill "{users.admin.email}" in the "Email" field
* I fill "{env.TEST_PASSWORD}" in the "Password" field
```

## Learn more

**Write tests**

- [Writing tests](docs/writing-tests.md): scenarios, elements, checks, tags.
- [Pages](docs/pages.md): named pages, and names for elements that have none.
- [Test data](docs/test-data.md): data files, passwords, data created through your app's API.
- [Keywords](docs/keywords.md): your own steps, made of existing steps.
- [Logging in](docs/logging-in.md): start tests logged in.
- [Organizing a suite](docs/organizing-tests.md): folders, titles, tags, and when to use a
  keyword, a page or a data file.
- [Troubleshooting](docs/troubleshooting.md): an element is not found, a test fails now and
  then, it fails only in CI.
- [AI authoring](docs/ai-authoring.md): let an assistant write tests.

**Review tests**

- [Reading tests](docs/reading-tests.md): one page for reviewers, about tests and the report.

**Set up and run**

- [Setup](docs/setup.md): what `init` wrote, the configuration, other environments, other
  browsers and phones.
- [Running in CI](docs/running-in-ci.md): a GitHub Actions workflow, screenshots for Linux, JUnit
  and Cucumber reports for Jenkins, GitLab, Azure DevOps and Jira.
- [Commands](docs/commands.md): running tests, `lint`, `inspect`, `catalog` and more.
- [Editor support](docs/ide-support.md): suggestions for steps in VS Code.
- [Other editors](docs/other-editors.md): IntelliJ IDEA, WebStorm, Neovim and more.

**Extend**

- [Steps in TypeScript](docs/writing-steps.md): your own steps in code, fixtures.

**Reference**

- [Step reference](docs/steps.md): every step with an example.
- [Glossary](docs/glossary.md): the words these docs use.
- [Vocabulary rules](docs/vocabulary.md): how steps are worded.
- [Versioning](docs/versioning.md): what counts as a breaking change, before and after 1.0.

**Coming from another tool:** [Gauge](docs/migrating-from-gauge.md) ·
[Robot Framework](docs/coming-from-robot-framework.md)

## Contributing

Issues and pull requests are welcome: see [contributing](CONTRIBUTING.md).

## License

[MIT](LICENSE)
