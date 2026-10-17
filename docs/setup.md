# Setting up Plainwright for your app

This page is for whoever connects Plainwright to an app, usually once per project: a developer
or a QA engineer who knows the app's addresses. After that, people write tests in feature files
without touching any of this.

The quickest way is to start from the [starter](../examples/starter) and change three things:
`baseURL` in `playwright.config.ts`, the pages in `pages/`, and the `webServer` entry
(start your app there, or remove it if the app is already running somewhere).

## Adding Plainwright to an existing project

```bash
npm install --save-dev @nils.hoyer/plainwright playwright-bdd @playwright/test
npx playwright install chromium
```

**1. Configure Playwright** (`playwright.config.ts`):

```ts
import { defineConfig, devices } from '@playwright/test';
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
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:3000',
    // A click or fill that finds nothing fails after 10 s and lists what the page offers.
    actionTimeout: 10_000,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
```

**2. Add the test command** to `package.json`. `bddgen` turns the feature files into
Playwright tests, then Playwright runs them:

```bash
npm pkg set scripts.test="bddgen && playwright test"
```

No step file is needed. To add your own fixtures, see [your own steps](writing-steps.md#your-own-fixtures).

**3. Optional: name your pages,** one file each in `pages/`, so tests say
`I open the "Login" page` instead of `I open the url "/login"`. More, including the VS Code
setting that checks these files, in [pages, test data and fixtures](pages-and-data.md).

```json
// pages/login.json
{ "name": "Login", "url": "/login" }
```

Pages in `pages/`, test data in `data/`, keywords in `keywords/` and a `.env` file load by
themselves from the project folder.

**4. Write a feature** in `features/` and run it with `npm test`. More
commands are in [commands](commands.md).

## Options

Set them under `use` in `playwright.config.ts`.

| Option          | Default            | Meaning                                                                                                                             |
| --------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `baseURL`       | none               | Address of the app. Page addresses and `I open the url "/…"` are relative to it.                                                    |
| `exactNames`    | `true`             | Element names must match exactly, with the same capitals. `false` also accepts part of a name, any capitals.                        |
| `actionTimeout` | none (Playwright)  | How long a click or fill waits for its element. Set 10 s, so a missing element fails soon and the error lists what the page offers. |
| `trace`         | `off` (Playwright) | `retain-on-failure` keeps a replay of every failed test in the report.                                                              |

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
