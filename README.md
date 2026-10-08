# playwright-keywords

Readable, keyword-driven tests for [Playwright](https://playwright.dev/).

People or AI write browser tests as short, plain sentences. Someone without programming
knowledge can review a test by reading it, and confirm the result in the Playwright report.
Tests run on the native Playwright runner through
[playwright-bdd](https://github.com/vitalets/playwright-bdd).

```gherkin
Feature: Login

  Scenario: Successful login
    * I open the "Login" page
    * I fill "1234567890" in the "Username" field
    * I fill "password123" in the "Password" field
    * I click the "Log in" button
    * I see the text "Welcome back!"
```

> **Status: experimental (0.x).** The vocabulary is settling. Changes to step wording are
> listed in the [changelog](CHANGELOG.md); see the [versioning policy](docs/versioning.md).

## How it reads

- **Every value is in double quotes.** Anything in quotes is data; the rest of the sentence is fixed.
- **Elements are named by what the user sees:** `the "Log in" button`, `the "Email" field`.
  No CSS, XPath or test IDs in feature files.
- **One phrase per action**, and every step does exactly what it says.
- **Checks start with `I see` / `I do not see`** and wait automatically (up to 5 seconds).
- `Given` / `When` / `Then` are optional; `*` works everywhere.

Reviewers: the one-page [guide to reading tests](docs/reading-tests.md) is all you need.

## Quick start

```bash
npm install --save-dev playwright-keywords playwright-bdd @playwright/test
npx playwright install chromium
```

**1. Configure Playwright** (`playwright.config.ts`):

```ts
import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';
import { aiFixPromptTemplate } from 'playwright-keywords';

const testDir = defineBddConfig({
  features: 'features/**/*.feature',
  steps: 'steps/**/*.ts',
  aiFix: { promptAttachment: true, promptTemplate: aiFixPromptTemplate },
});

export default defineConfig({
  testDir,
  use: {
    baseURL: 'http://localhost:3000',
    // A click or fill that finds nothing fails after 10 s and lists what the page offers.
    actionTimeout: 10_000,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
```

**2. Export the test and name your pages** (`steps/fixtures.ts`, `steps/pages.ts`):

```ts
// steps/fixtures.ts: playwright-bdd imports this `test` into the generated tests.
// To add your own fixtures, see "Steps in TypeScript" below.
export { test } from 'playwright-keywords';
```

```ts
// steps/pages.ts
import { definePage } from 'playwright-keywords';

definePage('Login', { url: '/login' });
definePage('Dashboard', { url: '/dashboard' });
```

**3. Write a feature** (`features/login.feature`), like the one at the top.

**4. Run it:**

```bash
npx bddgen && npx playwright test
npx playwright show-report
```

The report shows every sentence as a step, with screenshots and a trace for failures.

A complete project is in [examples/starter](examples/starter).

## Writing tests

### Elements

A step names an element by its visible name followed by its type. The type decides how the
element is found:

<!-- generated:element-types -->

| Written as             | Finds                                                                                                                      |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `the "…" button`       | a button with this name (`getByRole('button')`)                                                                            |
| `the "…" link`         | a link with this text (`getByRole('link')`)                                                                                |
| `the "…" field`        | a text field with this label, or else this placeholder (`getByLabel`, `getByPlaceholder`)                                  |
| `the "…" checkbox`     | a checkbox with this label (`getByRole('checkbox')`)                                                                       |
| `the "…" radio button` | a radio button with this label (`getByRole('radio')`)                                                                      |
| `the "…" dropdown`     | a dropdown (select box) with this label (`getByRole('combobox')`, `'listbox'`)                                             |
| `the "…" heading`      | a heading with this text (`getByRole('heading')`)                                                                          |
| `the "…" tab`          | a tab with this name (`getByRole('tab')`)                                                                                  |
| `the "…" dialog`       | a dialog or alert dialog with this title (`getByRole('dialog')`, `'alertdialog'`)                                          |
| `the "…" menu item`    | a menu item with this name, also one that can be ticked (`getByRole('menuitem')`, `'menuitemcheckbox'`, `'menuitemradio'`) |
| `the "…" image`        | an image with this alternative text or name (`getByAltText`, `getByRole('img')`)                                           |
| `the "…" section`      | a section (landmark region) with this name (`getByRole('region')`)                                                         |
| `the "…" list`         | a list with this name (`getByRole('list')`)                                                                                |
| `the "…" element`      | any element showing exactly this text (`getByText`); mostly used with aliases                                              |

<!-- /generated:element-types -->

Names match exactly (case and whole text). For substring matches set `use: { exactNames: false }`
in the Playwright config.

When an element cannot be found, the error lists what the page offers:

```
No "Sign in" button found on the "Login" page.
Buttons on this page: "Accept Cookies", "Log in".
```

### Pages and aliases

`definePage()` gives a page a name for `I open the "…" page` and `I am on the "…" page`.
Where an element has no usable visible name (an icon button, an unlabeled field, two buttons
both called "Delete"), give it one with an alias. Aliases apply while that page is open.

```ts
definePage('Orders', {
  url: '/orders',
  elements: {
    // a field without label: the "Search" field
    Search: '[data-testid="search"]',
    // name plus type, so the "Settings" dialog is still found by its title
    '"Settings" button': '[data-testid="settings"]',
    // a function for anything more specific
    'Delete order 1001': (page) => page.locator('tr', { hasText: '1001' }).getByRole('button'),
  },
});
```

Use aliases sparingly: an element without a visible name is usually an accessibility problem
worth fixing in the app.

### Keywords: your own steps, written in Gherkin

Repeated sequences become keywords. A keyword is a `Scenario Outline:` whose title is the new
step; parameters are written `"<name>"`. Reviewers can read keyword definitions too.

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
      | username   | password    |
      | 1234567890 | password123 |
```

```ts
// steps/keywords.ts
import { defineKeywords } from 'playwright-keywords';

defineKeywords('keywords/**/*.feature');
```

A `<name>` in the keyword's steps is replaced by the value only when `name` is a parameter in
the title. Any other `<…>`, such as `"<b>bold</b>"`, is text and stays as written; lint warns
when it looks like a misspelled parameter. Values arrive unchanged, backslashes included.

Now `* I log in as "1234567890" with password "password123"` works in any feature. The report
shows the keyword's steps nested under it, and errors point to the line in the keyword file.
Before any test runs, every keyword is checked: each step must match exactly one step, all
parameters must exist and be used, keywords must not call each other in a loop, and the title
must not match another step. The optional `Examples` row is used as the documented example.

Steps inside keywords must be built-in, keywords, or defined with `defineStep()` (steps defined
directly with playwright-bdd's `Given`/`When`/`Then` are unknown to keywords and lint). They may
use only the `page` and `world` fixtures, which is true for all built-in steps. Data tables in
keywords are not supported yet.

### Steps in TypeScript

For things no built-in step covers, define a step with `defineStep()`. It then also appears in
docs, the AI catalog, lint, and can be used inside keywords.

```ts
// steps/cart.steps.ts
import { expect } from '@playwright/test';
import { defineStep } from 'playwright-keywords';

defineStep({
  pattern: 'I see {string} in the cart',
  description: 'Checks that the cart lists the product.',
  example: 'I see "Coffee" in the cart',
  category: 'Shop',
  fn: async ({ world }, product: string) => {
    await expect(world.page.getByRole('list', { name: 'Cart' })).toContainText(product);
  },
});
```

The `world` fixture holds the active tab (`world.page`), the active frame, the current page
definition and `world.element(ref)` to resolve an `{element}` parameter. Use
`defineParameterType()` from this package (not from playwright-bdd) for custom parameter types,
so lint and keywords know them.

**Your own fixtures.** Extend `test` as usual in Playwright and pass it to `useTest()`, so
playwright-bdd runs every feature with it. Steps then get your fixtures like `world`:

```ts
// steps/fixtures.ts
import { test as base, useTest, type StepFixtures } from 'playwright-keywords';

type ProjectFixtures = { account: Account };
export type Fixtures = StepFixtures & ProjectFixtures;

export const test = useTest(
  base.extend<ProjectFixtures>({
    account: async ({}, use) => use(await createAccount()),
  }),
);
```

```ts
// steps/account.steps.ts
import { defineStep } from 'playwright-keywords';
import type { Fixtures } from './fixtures';

defineStep<Fixtures>({
  pattern: 'I log in with a new account',
  description: 'Logs in on the open login page with a freshly created account.',
  example: 'I log in with a new account',
  fn: async ({ world, account }) => {
    await world.page.getByLabel('Email').fill(account.email);
    // …
  },
});
```

Steps that use your fixtures cannot be used inside keywords, which only pass `page` and `world`.

**Steps for some features only.** As in playwright-bdd, a step file in a folder named after a
tag (`steps/@admin/users.steps.ts`) only applies to scenarios with that tag. Two folders may
define the same wording for different tags.

## AI writes, you review

The vocabulary is small and strict, which makes it easy for an AI assistant to write tests and
easy for you to check them.

1. **Give the assistant the instructions.** Copy [templates/AGENTS.md](templates/AGENTS.md) into
   your project (also available for [Copilot](templates/copilot-instructions.md) and as a
   [Claude skill](templates/claude-skill/SKILL.md)).
2. **The assistant looks up steps and pages:**
   `npx playwright-keywords catalog --steps "steps/**/*.ts" --out steps.json` lists every step,
   element type and page, including your own steps and keywords.
3. **It looks at the real page:** `npx playwright-keywords inspect "Login" --steps "steps/**/*.ts" --base-url http://localhost:3000`
   prints the names of buttons, fields, links and so on, so it uses names that exist.
4. **It writes the scenario and lints it:**
   `npx playwright-keywords lint --features "features/**/*.feature" --steps "steps/**/*.ts"`
   reports unknown steps (with suggestions), selectors, absolute URLs and fixed waits.
5. **It runs the test.** For failed tests the report has a "Fix with AI" attachment with the
   scenario, the error and the page structure.
6. **You review** the feature file (plain sentences) and the report.

More in [docs/ai-authoring.md](docs/ai-authoring.md).

## Command line

```
npx playwright-keywords <command> [options]

  lint      Check feature files: unknown or ambiguous steps, selectors, absolute URLs,
            fixed waits, advanced steps (info) and keyword definitions.
  catalog   Write all steps, element types and pages as JSON for AI assistants.
  docs      Write all steps (yours included) as a Markdown reference.
  inspect   Open a page and list its elements by type and visible name.
  stubs     Write a step file for editor autocomplete, see docs/ide-support.md.
```

Pass your step files with `--steps "<glob>"` so your pages, steps and keywords are included.

## Guides

- [Reading tests](docs/reading-tests.md): one page for reviewers.
- [Vocabulary rules](docs/vocabulary.md): how steps are worded, and how to add one.
- [Migrating from Gauge](docs/migrating-from-gauge.md)
- [Coming from Robot Framework](docs/coming-from-robot-framework.md)
- [Editor support](docs/ide-support.md)
- [AI authoring](docs/ai-authoring.md)

## Step reference

Generated from the step registry (`npm run docs`).

<!-- generated:steps -->

### Core steps

The everyday vocabulary. Prefer these steps.

#### Pages and navigation

| Step                        | What it does                                                                                      | Example                        |
| --------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------ |
| `I open the {string} page`  | Opens the address of the page defined with this name and uses the element names defined for it.   | `I open the "Login" page`      |
| `I am on the {string} page` | Checks that the browser shows the address of this page and uses the element names defined for it. | `I am on the "Dashboard" page` |
| `I go back`                 | Goes back to the previous page, like the browser back button.                                     | `I go back`                    |
| `I reload the page`         | Reloads the current page.                                                                         | `I reload the page`            |

#### Clicking and typing

| Step                                            | What it does                                                                                                        | Example                                                                         |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `I click the {element}`                         | Clicks the element once with the left mouse button.                                                                 | `I click the "Log in" button`                                                   |
| `I double click the {element}`                  | Double-clicks the element.                                                                                          | `I double click the "Double click me" button`                                   |
| `I hover over the {element}`                    | Moves the mouse over the element without clicking.                                                                  | `I hover over the "Hover over me" element`                                      |
| `I fill {string} in the {element}`              | Replaces the content of the field with the text.                                                                    | `I fill "1234567890" in the "Username" field`                                   |
| `I clear the {element}`                         | Removes all text from the field.                                                                                    | `I clear the "Full Name" field`                                                 |
| `I check the {element}`                         | Ticks the checkbox or selects the radio button. Nothing changes if it is already ticked.                            | `I check the "I accept the terms and conditions" checkbox`                      |
| `I uncheck the {element}`                       | Unticks the checkbox. Nothing changes if it is already unticked.                                                    | `I uncheck the "Subscribe to newsletter" checkbox`                              |
| `I select {string} in the {element}`            | Chooses the option with this visible text in the dropdown.                                                          | `I select "Germany" in the "Country" dropdown`                                  |
| `I press {string}`                              | Presses a key or key combination, such as "Enter", "Tab" or "Control+A", on the focused element.                    | `I press "Enter"`                                                               |
| `I press {string} in the {element}`             | Focuses the element and presses a key or key combination there.                                                     | `I press "Enter" in the "Email" field`                                          |
| `I upload the file {string} with the {element}` | Chooses this file (path relative to the project folder) in the file field, or in the file dialog the element opens. | `I upload the file "test/test-app/test-file.txt" with the "Choose File" button` |
| `I drag the {element} to the {element}`         | Drags the first element with the mouse and drops it onto the second.                                                | `I drag the "Drag Me" element to the "Drop Here" element`                       |

#### Checking what you see

| Step                                              | What it does                                                                             | Example                                                             |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `I see the {element}`                             | Checks that the element is visible.                                                      | `I see the "Welcome to your Dashboard" heading`                     |
| `I do not see the {element}`                      | Checks that the element is hidden or not on the page.                                    | `I do not see the "Close" button`                                   |
| `I see the text {string}`                         | Checks that some visible element on the page contains this text, with the same capitals. | `I see the text "Welcome back!"`                                    |
| `I do not see the text {string}`                  | Checks that no visible element on the page contains this text, with the same capitals.   | `I do not see the text "Username and password are incorrect."`      |
| `I see the text {string} in the {element}`        | Checks that the element contains this text, with the same capitals.                      | `I see the text "Savings" in the "Account Overview" section`        |
| `I do not see the text {string} in the {element}` | Checks that the element does not contain this text, with the same capitals.              | `I do not see the text "Loans" in the "Account Overview" section`   |
| `I see the value {string} in the {element}`       | Checks that the field contains exactly this value.                                       | `I see the value "Jane Doe" in the "Full Name" field`               |
| `I see {string} selected in the {element}`        | Checks that the option with this visible text is selected in the dropdown.               | `I see "Germany" selected in the "Country" dropdown`                |
| `I see the {element} is empty`                    | Checks that the field has no value, or that the element has no text.                     | `I see the "Full Name" field is empty`                              |
| `I see the {element} is enabled`                  | Checks that the element can be used (it is not disabled).                                | `I see the "Log in" button is enabled`                              |
| `I see the {element} is disabled`                 | Checks that the element is disabled and cannot be used.                                  | `I see the "Log in" button is disabled`                             |
| `I see the {element} is checked`                  | Checks that the checkbox is ticked or the radio button is selected.                      | `I see the "I accept the terms and conditions" checkbox is checked` |
| `I see the {element} is not checked`              | Checks that the checkbox is not ticked or the radio button is not selected.              | `I see the "Subscribe to newsletter" checkbox is not checked`       |
| `I see {number} item(s) in the {element}`         | Checks how many visible items the list has.                                              | `I see "3" items in the "Accounts" list`                            |

#### Dialogs

| Step                                       | What it does                                                                                                                                                                                      | Example                                             |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `I accept the next dialog`                 | Clicks OK in the next alert, confirm or prompt dialog. Use it before the step that opens the dialog; dialogs nobody announced are dismissed, except "Leave site?", which is accepted.             | `I accept the next dialog`                          |
| `I dismiss the next dialog`                | Clicks Cancel in the next confirm, prompt or "Leave site?" dialog. Use it before the step that opens the dialog; dialogs nobody announced are dismissed, except "Leave site?", which is accepted. | `I dismiss the next dialog`                         |
| `I see a dialog with the message {string}` | Checks that a dialog with exactly this message was shown during the test.                                                                                                                         | `I see a dialog with the message "Do you confirm?"` |

### Advanced steps

For special cases. `lint` lists where they are used.

#### Pages and navigation

| Step                                       | What it does                                                                                          | Example                                   |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `I use the page object {string}`           | Uses the element names defined for this page without opening it or checking the address.              | `I use the page object "Login"`           |
| `I open the url {string}`                  | Opens a web address, absolute or relative to the base URL. Prefer named pages: I open the "..." page. | `I open the url "/login.html"`            |
| `I go forward`                             | Goes forward to the next page, like the browser forward button.                                       | `I go forward`                            |
| `I see the url {string}`                   | Checks that the address is exactly this URL (relative URLs use the base URL).                         | `I see the url "/dashboard.html"`         |
| `I see the url containing {string}`        | Checks that the address contains this text.                                                           | `I see the url containing "dashboard"`    |
| `I do not see the url containing {string}` | Checks that the address does not contain this text.                                                   | `I do not see the url containing "login"` |
| `I see the page title {string}`            | Checks that the title of the browser tab is exactly this text.                                        | `I see the page title "Login"`            |
| `I see the page title containing {string}` | Checks that the title of the browser tab contains this text.                                          | `I see the page title containing "Log"`   |

#### Clicking and typing

| Step                                             | What it does                                                                                           | Example                                                                     |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| `I right click the {element}`                    | Clicks the element with the right mouse button, which usually opens a context menu.                    | `I right click the "Right click me" element`                                |
| `I focus on the {element}`                       | Puts the keyboard focus on the element without clicking it.                                            | `I focus on the "Full Name" field`                                          |
| `I select option {number} in the {element}`      | Chooses the option at this position in the dropdown, counting from 1.                                  | `I select option "3" in the "Country" dropdown`                             |
| `I upload the files {string} with the {element}` | Chooses several files, separated by commas, in the file field or in the file dialog the element opens. | `I upload the files "a.txt, b.txt" with the "Choose Multiple Files" button` |

#### Checking what you see

| Step                                                                    | What it does                                                                          | Example                                                                             |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `I see exactly the text {string} in the {element}`                      | Checks that the whole text of the element is exactly this text.                       | `I see exactly the text "Hello World" in the "Greeting" element`                    |
| `I see the {element} is focused`                                        | Checks that the element has the keyboard focus.                                       | `I see the "Full Name" field is focused`                                            |
| `I see the {element} is editable`                                       | Checks that the field accepts input (it is neither disabled nor read-only).           | `I see the "Full Name" field is editable`                                           |
| `I see the {element} is read-only`                                      | Checks that the field shows a value but does not accept input.                        | `I see the "Read-only Field" field is read-only`                                    |
| `I see the {element} is in the viewport`                                | Checks that the element is inside the visible part of the page, without scrolling.    | `I see the "Top of the page" element is in the viewport`                            |
| `I see the {element} is not in the viewport`                            | Checks that the element is outside the visible part of the page.                      | `I see the "Bottom of the page" element is not in the viewport`                     |
| `I see the {element} with the description {string}`                     | Checks the description screen readers announce for the element (aria-describedby).    | `I see the "Name" field with the description "This is a hint for the input below."` |
| `I see the {element} with the error message {string}`                   | Checks the error message screen readers announce for the element (aria-errormessage). | `I see the "Required field" field with the error message "This field is required."` |
| `I see the attribute {string} on the {element}`                         | Checks that the element has this HTML attribute, with any value.                      | `I see the attribute "disabled" on the "Coming Soon" button`                        |
| `I do not see the attribute {string} on the {element}`                  | Checks that the element does not have this HTML attribute.                            | `I do not see the attribute "disabled" on the "Transfer Money" button`              |
| `I see the attribute {string} with the value {string} on the {element}` | Checks that the HTML attribute of the element has exactly this value.                 | `I see the attribute "href" with the value "forms.html" on the "Forms Demo" link`   |
| `I see the attribute {string} containing {string} on the {element}`     | Checks that the HTML attribute of the element contains this text.                     | `I see the attribute "href" containing "forms" on the "Forms Demo" link`            |
| `I see the class {string} on the {element}`                             | Checks that the element has this CSS class (among others).                            | `I see the class "highlighted" on the "Styled box" element`                         |
| `I do not see the class {string} on the {element}`                      | Checks that the element does not have this CSS class.                                 | `I do not see the class "hidden" on the "Styled box" element`                       |

#### Dialogs

| Step                                     | What it does                                                                                            | Example                                     |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `I accept the next dialog with {string}` | Types the text into the next prompt dialog and clicks OK. Use it before the step that opens the dialog. | `I accept the next dialog with "My answer"` |

#### Tabs and frames

| Step                             | What it does                                                                              | Example                            |
| -------------------------------- | ----------------------------------------------------------------------------------------- | ---------------------------------- |
| `I switch to tab {number}`       | Continues in the browser tab at this position, counting from 1.                           | `I switch to tab "2"`              |
| `I open a new tab`               | Opens an empty browser tab and continues in it.                                           | `I open a new tab`                 |
| `I close the current tab`        | Closes the current browser tab and continues in the last remaining one.                   | `I close the current tab`          |
| `I see {number} tab(s)`          | Checks how many browser tabs are open.                                                    | `I see "2" tabs`                   |
| `I switch to the {string} frame` | Continues inside the embedded frame (iframe) with this title or name, or with this alias. | `I switch to the "Greeting" frame` |
| `I switch to the main frame`     | Leaves the embedded frame and continues on the page itself.                               | `I switch to the main frame`       |

#### Keyboard, mouse and touch

| Step                                                | What it does                                                                                                         | Example                                     |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `I type {string} on the keyboard`                   | Types the text key by key into the focused element, without clearing it first. To replace a field value, use I fill. | `I type "Hello" on the keyboard`            |
| `I hold down the key {string}`                      | Presses the key and keeps it pressed until I release the key.                                                        | `I hold down the key "Shift"`               |
| `I release the key {string}`                        | Releases a key that was held down.                                                                                   | `I release the key "Shift"`                 |
| `I insert the text {string}`                        | Inserts the text into the focused element at once, without key presses (like pasting).                               | `I insert the text "嗨"`                    |
| `I click at x {number} y {number}`                  | Clicks at this position, in pixels from the top left corner of the page view.                                        | `I click at x "200" y "150"`                |
| `I double click at x {number} y {number}`           | Double-clicks at this position, in pixels from the top left corner of the page view.                                 | `I double click at x "200" y "150"`         |
| `I right click at x {number} y {number}`            | Right-clicks at this position, in pixels from the top left corner of the page view.                                  | `I right click at x "200" y "150"`          |
| `I move the mouse to x {number} y {number}`         | Moves the mouse to this position, in pixels from the top left corner of the page view.                               | `I move the mouse to x "200" y "150"`       |
| `I press the mouse button`                          | Presses the left mouse button and keeps it pressed until I release the mouse button.                                 | `I press the mouse button`                  |
| `I press the {string} mouse button`                 | Presses the "left", "right" or "middle" mouse button and keeps it pressed.                                           | `I press the "left" mouse button`           |
| `I release the mouse button`                        | Releases the mouse button that was pressed.                                                                          | `I release the mouse button`                |
| `I scroll the mouse wheel by x {number} y {number}` | Turns the mouse wheel by this many pixels sideways (x) and down (y).                                                 | `I scroll the mouse wheel by x "0" y "100"` |
| `I tap the {element}`                               | Taps the element on a touch screen. Needs a browser with touch enabled (hasTouch).                                   | `I tap the "Tap me" button`                 |
| `I tap at x {number} y {number}`                    | Taps at this position on a touch screen. Needs a browser with touch enabled (hasTouch).                              | `I tap at x "300" y "200"`                  |

#### Scrolling

| Step                                 | What it does                               | Example                                                    |
| ------------------------------------ | ------------------------------------------ | ---------------------------------------------------------- |
| `I scroll to the {element}`          | Scrolls until the element is in view.      | `I scroll to the "You scrolled all the way down!" element` |
| `I scroll to the bottom of the page` | Scrolls to the end of the page.            | `I scroll to the bottom of the page`                       |
| `I scroll to the top of the page`    | Scrolls to the start of the page.          | `I scroll to the top of the page`                          |
| `I scroll down by {number} pixels`   | Scrolls the page down by this many pixels. | `I scroll down by "500" pixels`                            |
| `I scroll up by {number} pixels`     | Scrolls the page up by this many pixels.   | `I scroll up by "200" pixels`                              |

#### Waiting

| Step                                            | What it does                                                              | Example                                                |
| ----------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------ |
| `I wait {number} second(s)`                     | Pauses the test for this many seconds.                                    | `I wait "2" seconds`                                   |
| `I wait {number} millisecond(s)`                | Pauses the test for this many milliseconds.                               | `I wait "500" milliseconds`                            |
| `I see the {element} within {number} second(s)` | Checks that the element becomes visible, waiting up to this many seconds. | `I see the "Report ready" heading within "30" seconds` |
| `I wait for the page to load`                   | Waits until the browser reports that the page and its images have loaded. | `I wait for the page to load`                          |
| `I wait for network idle`                       | Waits until the page has made no network requests for half a second.      | `I wait for network idle`                              |

#### Cookies and storage

| Step                                                            | What it does                                                                        | Example                                                      |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `I set the cookie {string} to {string}`                         | Stores a cookie with this name and value for the current website.                   | `I set the cookie "session" to "abc123"`                     |
| `I delete the cookie {string}`                                  | Removes the cookie with this name.                                                  | `I delete the cookie "session"`                              |
| `I clear all cookies`                                           | Removes all cookies of the browser session.                                         | `I clear all cookies`                                        |
| `I see the cookie {string}`                                     | Checks that a cookie with this name exists.                                         | `I see the cookie "cookies_accepted"`                        |
| `I do not see the cookie {string}`                              | Checks that no cookie with this name exists.                                        | `I do not see the cookie "session"`                          |
| `I see the cookie {string} with the value {string}`             | Checks that the cookie with this name has exactly this value.                       | `I see the cookie "session" with the value "abc123"`         |
| `I set the local storage item {string} to {string}`             | Stores a value in the local storage of the current website.                         | `I set the local storage item "theme" to "dark"`             |
| `I clear the local storage`                                     | Removes all values from the local storage of the current website.                   | `I clear the local storage`                                  |
| `I see the local storage item {string} with the value {string}` | Checks that the local storage of the current website has this value under this key. | `I see the local storage item "theme" with the value "dark"` |

#### Screenshots

| Step                                                  | What it does                                                                                                  | Example                                                                    |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `I take a screenshot`                                 | Adds a screenshot of the visible page to the test report.                                                     | `I take a screenshot`                                                      |
| `I take a screenshot named {string}`                  | Adds a screenshot of the visible page to the test report under this name.                                     | `I take a screenshot named "Login form"`                                   |
| `I take a screenshot of the {element}`                | Adds a screenshot of just this element to the test report.                                                    | `I take a screenshot of the "Account Overview" section`                    |
| `I see the {element} matches the screenshot {string}` | Compares the element with the stored screenshot of this name. Without one, it stores one and fails once.      | `I see the "Blue square" section matches the screenshot "blue-square.png"` |
| `I see the page matches the screenshot {string}`      | Compares the visible page with the stored screenshot of this name. Without one, it stores one and fails once. | `I see the page matches the screenshot "swatch-page.png"`                  |

#### Downloads

| Step                                     | What it does                                                          | Example                                                    |
| ---------------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------- |
| `I download the file with the {element}` | Clicks the element and waits until the file it offers has downloaded. | `I download the file with the "Download Test File" button` |
| `I see the downloaded file {string}`     | Checks the file name of the last download.                            | `I see the downloaded file "test-download.txt"`            |
| `I save the downloaded file to {string}` | Saves the last download at this path, relative to the project folder. | `I save the downloaded file to "test-results/report.csv"`  |

<!-- /generated:steps -->

## Contributing

1. Open an issue describing the behaviour you need. A new **core** step also needs an update to
   the [reviewer guide](docs/reading-tests.md).
2. Run `npm run verify` locally: format check, type check, docs check, feature lint, unit tests
   and the end-to-end tests against the test app in `test/test-app`.
3. Open a pull request with the implementation and tests.

## License

MIT
