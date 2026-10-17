# Commands

Every command runs in a terminal in your project folder. In the
[starter](../examples/starter), the short `npm run …` names in the second column do the same with
the starter's folders filled in.

## Running tests

| Command                                      | Starter                | What it does                                                           |
| -------------------------------------------- | ---------------------- | ---------------------------------------------------------------------- |
| `npx bddgen && npx playwright test`          | `npm test`             | Turns the feature files into Playwright tests and runs all of them.    |
| `npx bddgen && npx playwright test login`    | `npm test -- login`    | Runs only feature files whose path contains "login".                   |
| `npx bddgen && npx playwright test --headed` | `npm test -- --headed` | Runs with a visible browser window.                                    |
| `npx bddgen && npx playwright test --ui`     | `npm test -- --ui`     | Opens Playwright's UI mode: pick tests, watch them, step through them. |
| `npx playwright show-report`                 | `npm run report`       | Opens the report of the last run in the browser.                       |
| `npx playwright show-trace <trace.zip>`      |                        | Replays a failed test step by step (the report links the trace).       |

`bddgen` comes with playwright-bdd, the rest with Playwright. Their own documentation lists all
options: [Playwright command line](https://playwright.dev/docs/test-cli),
[playwright-bdd](https://vitalets.github.io/playwright-bdd/).

## Plainwright's commands

```
npx plainwright <command> [options]
```

`pages/`, `data/`, `keywords/` and `.env` in the current folder load by themselves, and so
do your step files in `steps/`. Pass `--steps "<glob>"` for step files elsewhere. Repeat `--steps`
and `--features` for several patterns.

### lint: check feature files before running them

```bash
npx plainwright lint --features "features/**/*.feature"
```

Starter: `npm run lint`. Prints one line per problem, `file:line: severity: message (rule)`, and
exits with code 1 if there is an error, so it can stop a CI run.

| Rule                     | Severity | Reports                                                                             |
| ------------------------ | -------- | ----------------------------------------------------------------------------------- |
| `undefined-step`         | error    | A step that matches no step, with the closest existing one.                         |
| `ambiguous-step`         | error    | A step that matches several steps.                                                  |
| `unknown-page`           | error    | A page name that no file in `pages/` (or TypeScript) defines.                       |
| `unknown-value`          | error    | A `{value}` in quotes that no data file, earlier step or built-in value provides.   |
| `selector`               | error    | An element name that looks like CSS, XPath or a test ID.                            |
| `absolute-url`           | error    | `I open the url "https://…"`: use a page name or a relative address.                |
| `keyword`                | error    | A broken keyword; a warning for `<…>` that looks like a misspelled parameter.       |
| `syntax`                 | error    | A feature file Gherkin cannot read.                                                 |
| `step-example`           | error    | A step definition whose `example` does not match it.                                |
| `discouraged-step`       | warning  | A step with a better alternative, such as fixed waits.                              |
| `unknown-parameter-type` | warning  | A step that keywords and lint cannot check, see [your own steps](writing-steps.md). |
| `advanced-step`          | info     | An advanced step. `--quiet` hides these.                                            |

### inspect: list the names on a page

```bash
npx plainwright inspect "Login" --base-url http://localhost:3000
```

Starter: `npm run app` in one terminal, then `npm run inspect -- "Todos"` in another. Opens the
page in Chromium and lists its buttons, fields, links, headings, rows and so on, by the names
steps use (`the "Log in" button`), and how many elements of each type have no name.

| Option                   | Meaning                                                        |
| ------------------------ | -------------------------------------------------------------- |
| `<page name or URL>`     | A page from `pages/`, or an address.                           |
| `--base-url <url>`       | Where relative addresses and page addresses start.             |
| `--storage-state <file>` | Open the page logged in, see [logging in once](logging-in.md). |
| `--json`                 | Print JSON instead of a list.                                  |

### catalog: all steps as JSON

```bash
npx plainwright catalog --out steps.json
```

Starter: `npm run catalog`. Writes every step with its description, example, level and
parameters, plus the element types, the wording rules, and your pages and aliases. Made for AI
assistants, see [AI authoring](ai-authoring.md).

### docs: all steps as Markdown

```bash
npx plainwright docs --out STEPS.md
```

The same list as the [step reference](steps.md), including your own steps and keywords.

### stubs: autocomplete in the editor

```bash
npx plainwright stubs --out .vscode/plainwright.steps.js
```

Starter: `npm run stubs`. Writes a file the Cucumber extension for VS Code reads, so the editor
suggests steps while you type. See [editor support](ide-support.md).

| Option         | Commands             | Meaning                                     |
| -------------- | -------------------- | ------------------------------------------- |
| `--out <file>` | catalog, docs, stubs | Write to this file instead of the terminal. |
| `--quiet`      | lint                 | Hide info messages.                         |
| `--help`       | all                  | Show the built-in help.                     |
