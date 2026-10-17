# Setting up Plainwright for your app

This page is for whoever connects Plainwright to an app, usually once per project: a developer
or a QA engineer who knows the app's addresses. After that, people write tests in feature files
without touching any of this.

The quickest way is one command, in an empty folder or in your project:

```bash
npx @nils.hoyer/plainwright@latest init
```

It asks two questions, the address of your app and which AI assistant you use, and then:

- installs `@nils.hoyer/plainwright`, `playwright-bdd`, `@playwright/test` and Chromium, with
  the package manager of the project (npm, pnpm, Yarn or Bun);
- writes `playwright.config.ts`, a page `pages/start.json`, a first test
  `features/example.feature` that checks what your start page shows, a commented example in
  `keywords/`, the instructions for your AI assistant, VS Code settings and `.gitignore`
  entries;
- adds the scripts `test`, `report`, `lint`, `inspect`, `catalog` and `stubs` to `package.json`;
- runs the first test.

It never overwrites a file. Running it again adds only what is missing and says what it
skipped. In a project with its own Playwright configuration, it prints the lines to add.

| Option             | Meaning                                                       |
| ------------------ | ------------------------------------------------------------- |
| `--url <address>`  | The address of your app, instead of asking.                   |
| `--ai <assistant>` | `agents` (AGENTS.md), `copilot`, `claude` or `none`.          |
| `--yes`, `-y`      | Take the defaults for everything not given, and run the test. |
| `--dry-run`        | Only list what would change.                                  |
| `--no-install`     | Do not install packages and Chromium.                         |
| `--no-run`         | Do not run the first test.                                    |

`npx @nils.hoyer/plainwright init --yes --url http://localhost:3000 --ai agents` sets up a
project without questions, for CI or an AI assistant.

To try Plainwright with an example app first, the [starter](../examples/starter) is a complete
project with a small todo app.

## The configuration

`playwright.config.ts` needs one line besides the address of your app:

```ts
import { defineConfig } from '@nils.hoyer/plainwright/config';

export default defineConfig({
  // The address of your app. "/login" in a test means http://localhost:3000/login
  baseURL: 'http://localhost:3000',
});
```

`defineConfig()` sets up what Plainwright needs: tests in `features/`, your own steps (if any) in
`steps/`, Plainwright's ready-made steps, Chromium, the options below, and a "Fix with AI" prompt
for failed tests in the report. Every [Playwright option](https://playwright.dev/docs/test-configuration)
can be added or changed, for example starting your app:

```ts
export default defineConfig({
  baseURL: 'http://localhost:3000',
  webServer: { command: 'npm run start', url: 'http://localhost:3000' },
  use: { exactNames: false },
});
```

| Option     | Default                 | Meaning                                                                                           |
| ---------- | ----------------------- | ------------------------------------------------------------------------------------------------- |
| `baseURL`  | none                    | Address of the app.                                                                               |
| `features` | `features/**/*.feature` | Where the tests are.                                                                              |
| `steps`    | `steps/**/*.{ts,js}`    | Your steps in TypeScript or JavaScript.                                                           |
| `bdd`      | none                    | More [playwright-bdd options](https://vitalets.github.io/playwright-bdd/#/configuration/options). |

`npm test` runs `plainwright test`: it turns the feature files into Playwright tests (playwright-bdd's
`bddgen`) and runs them (`playwright test`). Options such as `--headed`, `--ui` or a file name go
to Playwright: `npm test -- --headed`.

Pages in `pages/`, test data in `data/`, keywords in `keywords/` and a `.env` file load by
themselves from the project folder. More in [pages, test data and fixtures](pages-and-data.md).

## With your own Playwright configuration

A project that already has a `playwright.config.ts` can keep it and add playwright-bdd:

```bash
npm install --save-dev @nils.hoyer/plainwright playwright-bdd @playwright/test
npx playwright install chromium
```

```ts
import { defineConfig } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';
import { aiFixPromptTemplate, steps } from '@nils.hoyer/plainwright';

const testDir = defineBddConfig({
  features: 'features/**/*.feature',
  // Your own steps, if any, and Plainwright's ready-made steps.
  steps: ['steps/**/*.ts', steps],
  // Failed tests get a "Fix with AI" prompt in the report.
  aiFix: { promptAttachment: true, promptTemplate: aiFixPromptTemplate },
});

export default defineConfig({
  testDir,
  use: { baseURL: 'http://localhost:3000', actionTimeout: 10_000, trace: 'retain-on-failure' },
});
```

Then run the tests with `npx plainwright test`. To keep other Playwright tests next to the
feature files, give each its own entry in `projects`, with its own `testDir`.

## Options

Set them under `use` in `playwright.config.ts`.

| Option          | Default                                            | Meaning                                                                                                                |
| --------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `baseURL`       | none                                               | Address of the app. Page addresses and `I open the url "/…"` are relative to it.                                       |
| `exactNames`    | `true`                                             | Element names must match exactly, with the same capitals. `false` also accepts part of a name, any capitals.           |
| `actionTimeout` | 10 s (`defineConfig()`), else none                 | How long a click or fill waits for its element. A missing element fails soon and the error lists what the page offers. |
| `trace`         | `retain-on-failure` (`defineConfig()`), else `off` | `retain-on-failure` keeps a replay of every failed test in the report.                                                 |

Checks (`I see …`) wait up to 5 seconds, Playwright's `expect.timeout`.

## Elements without a usable name: aliases

A step finds an element by what the user sees. Some elements show nothing usable: an icon-only
button, a field without a label. Give them a name in the page's file; the alias applies while
that page is open.

```json
// pages/orders.json
{
  "name": "Orders",
  "url": "/orders",
  "elements": {
    "Search": "[data-testid=search]",
    "\"Settings\" button": "[data-testid=settings]"
  }
}
```

`Search` is used as `the "Search" field`. The second key names the type too, so a "Settings"
dialog is still found by its title. A selector is CSS, or any Playwright selector such as
`text=Total`; for anything more specific, `definePage()` in TypeScript also takes a function
(see [pages, test data and fixtures](pages-and-data.md#in-typescript)).

Use aliases sparingly: an element without a visible name is usually also a problem for people
who use a screen reader, and worth fixing in the app. Several elements with the same name need
no alias: `the "Delete" button in the "Order 1001" row`.

## How element types are found

What each type word looks up in Playwright:

<!-- generated:element-types -->

| Written as             | Finds                                                                                                                      |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `the "…" button`       | a button with this name (`getByRole('button')`)                                                                            |
| `the "…" link`         | a link with this text (`getByRole('link')`)                                                                                |
| `the "…" field`        | a text field with this label, or else this placeholder, the grey hint inside it (`getByLabel`, `getByPlaceholder`)         |
| `the "…" checkbox`     | a checkbox with this label (`getByRole('checkbox')`)                                                                       |
| `the "…" radio button` | a radio button with this label (`getByRole('radio')`)                                                                      |
| `the "…" dropdown`     | a dropdown (select box) with this label (`getByRole('combobox')`, `'listbox'`)                                             |
| `the "…" heading`      | a heading with this text (`getByRole('heading')`)                                                                          |
| `the "…" tab`          | a tab with this name (`getByRole('tab')`)                                                                                  |
| `the "…" dialog`       | a dialog or alert dialog with this title (`getByRole('dialog')`, `'alertdialog'`)                                          |
| `the "…" menu item`    | a menu item with this name, also one that can be ticked (`getByRole('menuitem')`, `'menuitemcheckbox'`, `'menuitemradio'`) |
| `the "…" image`        | an image with this alternative text or name (`getByAltText`, `getByRole('img')`)                                           |
| `the "…" section`      | an area of the page (landmark region) with this name (`getByRole('region')`)                                               |
| `the "…" list`         | a list with this name (`getByRole('list')`)                                                                                |
| `the "…" list item`    | a list item that contains this text (`getByRole('listitem')`)                                                              |
| `the "…" row`          | a table row that contains this text, e.g. in its first cell (`getByRole('row')`)                                           |
| `the "…" cell`         | a table cell with this text (`getByRole('cell')`, `'gridcell'`)                                                            |
| `the "…" message`      | a notice, such as a toast or an error banner, that contains this text (`getByRole('alert')`, `'status'`)                   |
| `the "…" element`      | any element showing exactly this text; mostly for names your team defined, called aliases (`getByText`)                    |

<!-- /generated:element-types -->

## Logging in

If most tests start logged in, log in once per run and reuse the session: see
[logging in once](logging-in.md).
