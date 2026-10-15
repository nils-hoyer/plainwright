# Plainwright

[![npm](https://img.shields.io/npm/v/plainwright)](https://www.npmjs.com/package/plainwright)
[![CI](https://github.com/nils-hoyer/plainwright/actions/workflows/ci.yml/badge.svg)](https://github.com/nils-hoyer/plainwright/actions/workflows/ci.yml)
[![Sponsor](https://img.shields.io/github/sponsors/nils-hoyer?label=Sponsor&logo=GitHub)](https://github.com/sponsors/nils-hoyer)

Write browser tests as plain English sentences, and review them without reading code.
Plainwright is built on [Playwright](https://playwright.dev/) and comes with more than 100
ready-made steps for what you do in a browser: open pages, click, type, choose, upload, handle
dialogs, tabs and downloads, and check texts, values and states. You write sentences, not step
code.

```gherkin
Feature: Orders

  Scenario: Delete an order
    * I open the "Orders" page
    * I click the "Delete" button in the "Order 1001" row
    * I see the "Order 1001 deleted" message
```

## What you get

- **Sentences instead of code.** Everything in quotes is data; the rest of the sentence is fixed.
- **Names as on the screen:** `the "Log in" button`, `the "Email" field`. No CSS selectors or
  test IDs in your tests.
- **Errors that say what is there:**
  `No "Sign in" button found. Buttons on this page: "Accept Cookies", "Log in".`
- **Your own sentences without code.** Combine steps into a new sentence, written the same way.
- **AI writes, you check.** An assistant gets the list of sentences and the names on a page;
  `lint` catches anything it made up.
- **Playwright's report and replay:** every step, screenshots of failures, and a step-by-step
  replay of the test.

**Who it is for:** teams where people who don't program write or review tests (testers, business
analysts, product owners); teams moving from Gauge or Robot Framework; teams that let AI write
tests that people check.

## Getting started

You need [Node.js](https://nodejs.org/) (the LTS version) and a terminal.

```bash
npx degit nils-hoyer/plainwright/examples/starter my-tests
cd my-tests
npm install
npm test
```

The starter tests a small todo app that comes with it. `npm install` also installs the browser,
and `npm test` runs three tests. If a test fails, the report opens by itself; `npm run report`
opens it anytime. Change a sentence in `features/todos.feature`, run `npm test` again and see
what happens.

## Let AI write tests

Copy [templates/AGENTS.md](templates/AGENTS.md) into your project (also available as
[Copilot instructions](templates/copilot-instructions.md) and a
[Claude skill](templates/claude-skill/SKILL.md)). The assistant looks up the sentences with
`catalog`, the names on a page with `inspect`, and checks its test with `lint`. You review the
sentences and the report. More in [AI authoring](docs/ai-authoring.md).

## Write your first test

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

- `Feature` names the area, `Scenario` is one test, and each `*` line is a step.
- Everything in double quotes is data. Write the rest of the sentence exactly as listed below.
- An element is its name on the screen followed by its type: `the "Log in" button`.
- Sentences are English. Gherkin's own words (`Feature`, `Scenario`) also exist in other
  languages.

**The sentences you will use most:**

| To …                         | write                                                            |
| ---------------------------- | ---------------------------------------------------------------- |
| open a page                  | `I open the "Login" page`                                        |
| check where you are          | `I am on the "Dashboard" page`                                   |
| click                        | `I click the "Log in" button`                                    |
| type into a field            | `I fill "jane@example.com" in the "Email" field`                 |
| tick a checkbox              | `I check the "I accept the terms" checkbox`                      |
| choose from a dropdown       | `I select "Germany" in the "Country" dropdown`                   |
| press a key                  | `I press "Enter"`                                                |
| upload a file                | `I upload the file "files/invoice.pdf" with the "Upload" button` |
| answer the next pop-up       | `I accept the next dialog`                                       |
| check that something shows   | `I see the "Welcome" heading`                                    |
| check that something is gone | `I do not see the "Error" message`                               |
| check a text                 | `I see the text "Welcome back!"`                                 |
| check a text in one place    | `I see the text "Paid" in the "Order 1001" row`                  |
| check what a field contains  | `I see the value "Jane" in the "Name" field`                     |
| check a state                | `I see the "Log in" button is disabled`                          |
| count items                  | `I see "3" items in the "Cart" list`                             |

All sentences are in the [step reference](docs/steps.md). VS Code can suggest them while you
type: see [editor support](docs/ide-support.md).

**The same name twice?** Name the element it is in: `the "Delete" button in the "Order 1001" row`.

**Finding the right names:**

1. Use what the screen shows: the label next to a field, the text on a button.
2. Run the test: when a name is wrong, the error lists the names of that type on the page.
3. Ask Plainwright: `npm run inspect -- "Login"` lists the buttons, fields, links … of a page.
   See [commands](docs/commands.md).

## How names and texts are matched

- **Names match exactly, with the same capitals.** `the "Log in" button` does not find "Log In"
  or "Log in now". Your setup can relax this (`exactNames`, see [setup](docs/setup.md#options)).
- **Text checks find part of a text, with the same capitals.** `I see the text "Welcome"` passes
  on "Welcome back!", not on "welcome back!".
- **Rows, list items and messages are found by text they contain.** `the "Order 1001" row` is
  the table row that contains "Order 1001".
- **Field values and page addresses** are compared as a whole.
- **Checks wait.** `I see …` waits up to 5 seconds for the page to get there.

## When a test fails

- **The report** shows the failed step in red, with the error. For a missing element, the error
  lists what the page offers instead.
- **The replay:** open the trace from the report to step through the test, with a picture of the
  page before and after each step.
- **"Fix with AI":** the report has a prompt with the scenario, the error and the structure of the
  page, ready to paste into an AI chat.

The one-page [guide to reading tests](docs/reading-tests.md) explains the report for reviewers.

## Your own sentences

Steps you repeat become a keyword: a new sentence, written in the same language.

```gherkin
# keywords/account.feature
Feature: Account

  Scenario Outline: I log in as "<username>" with password "<password>"
    * I open the "Login" page
    * I fill "<username>" in the "Username" field
    * I fill "<password>" in the "Password" field
    * I click the "Log in" button
```

Now `I log in as "jane" with password "secret"` works in every test, and the report shows its
steps nested underneath. More, including steps in TypeScript: [your own steps](docs/writing-steps.md).

## Learn more

- [Reading tests](docs/reading-tests.md): one page for reviewers.
- [Step reference](docs/steps.md): every sentence with an example.
- [Commands](docs/commands.md): running tests, `lint`, `inspect`, `catalog` and more.
- [Setup](docs/setup.md) and [logging in once](docs/logging-in.md): connect Plainwright to
  your app, usually once by a developer. After that, tests are feature files only.
- [Your own steps](docs/writing-steps.md): keywords, steps in TypeScript, fixtures.
- [Vocabulary rules](docs/vocabulary.md) ·
  [AI authoring](docs/ai-authoring.md) · [Editor support](docs/ide-support.md)
- Coming from Gauge or Robot Framework? See [migrating from Gauge](docs/migrating-from-gauge.md)
  and [coming from Robot Framework](docs/coming-from-robot-framework.md).

## Contributing

1. Open an issue that describes the problem and the expected behaviour. A new core step also
   needs an update to the [reviewer guide](docs/reading-tests.md).
2. Install dependencies with `npm ci` and the browser with `npx playwright install chromium`.
3. Make your change in `src/` (built-in steps in `src/steps/`), with tests: unit tests in
   `test/unit/`, feature files in `test/features/` against the app in `test/test-app/`.
4. Run `npm run verify` (format, types, generated docs, feature lint, unit and end-to-end tests).
   It must pass; `npm run docs` updates the generated docs.
5. Open a pull request with the implementation and tests, and add your change under
   `## [Unreleased]` in [CHANGELOG.md](CHANGELOG.md). Don't change the version in
   `package.json`: the maintainer releases from GitHub Actions, which increases it.

## License

[MIT](LICENSE)
