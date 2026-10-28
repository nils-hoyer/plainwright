# Writing tests

This page is for people who write tests. It explains how a test is built, how a step names an
element, and what checks do. Which steps exist is in the [step reference](steps.md).

## A test is a list of steps

A test is a `.feature` file in `features/`. Addresses such as `"/login"` are relative to the
address of your app, `baseURL` in `playwright.config.ts`.

- **Feature** names the area being tested. A file has one.
- **Scenario** is one test. Its title says what it shows.
- Each line starting with `*` is a **step**. Steps run from top to bottom; the test stops at
  the first step that fails.
- **Background** steps run before every scenario of the file.
- Lines starting with `#` are comments.

```gherkin
Feature: Login

  Background:
    * I open the url "/login"

  Scenario: A wrong password shows an error
    * I fill "jane@example.com" in the "Email" field
    * I fill "wrong" in the "Password" field
    * I click the "Log in" button
    * I see the text "Email or password is incorrect."

  Scenario: The password can be reset
    * I click the "Forgot password?" link
    * I see the "Reset your password" heading
```

### Given, When, Then

`Given`, `When`, `Then` and `And` may stand instead of `*`. They mean the same and only help
reading: `Given` says what is there before the test, `When` what the user does, `Then` what
they see. Use one style per project. `*` is the default in these docs.

```gherkin
Scenario: A paid order can be refunded
  Given there is an order for "Coffee"
  When I open the url "/orders/{order.id}"
  And I click the "Refund" button
  Then I see the "Order refunded" message
```

### The same steps with different data

A `Scenario Outline` runs once for every row of its `Examples` table. Each row is its own test
in the report. A `Scenario Outline` in `features/` is a test. In `keywords/` it defines a new
step instead, see [keywords](keywords.md).

```gherkin
Scenario Outline: A wrong login shows an error
  * I open the url "/login"
  * I fill "<email>" in the "Email" field
  * I fill "<password>" in the "Password" field
  * I click the "Log in" button
  * I see the text "<error>"

  Examples:
    | email            | password | error                           |
    | jane@example.com | wrong    | Email or password is incorrect. |
    | jane@example     | secret   | Enter a valid email address.    |
```

### Tags

A word with `@` above a feature or scenario is a tag. `--grep` runs only the tests with a tag.

```gherkin
@smoke
Scenario: The start page opens
  * I open the url "/"
  * I see the "Welcome" heading
```

```bash
npm test -- --grep @smoke
```

## How a step is built

Everything in double quotes is **data**: text to type, a name on the screen, an expected value.
The rest of the sentence is fixed and means the same in every test. A name in braces inside the
quotes, such as `"{users.admin.email}"`, is a value from a data file, the environment or an
earlier step: see [test data](test-data.md).

> I fill **"jane@example.com"** in the **"Email" field**

- `I fill … in …` is the action.
- `"jane@example.com"` is the text typed.
- `the "Email" field` is the element: its name on the screen, then its type.

## Elements

A step finds an element the way a user does: by the name on the screen and the kind of
element. The name is the button's text, the field's label, the link's text. If you are not sure
what the name is, `npm run inspect -- "/login"` lists every element of a page by the names
steps use.

Names must match exactly, with the same capitals. Rows, list items and messages are the
exception: they are found by text they contain, because their full text is long. To accept
part of a name and any capitals everywhere, set `exactNames: false` (see
[setup](setup.md#options)).

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

### Elements with the same name

When several elements have the same name, name the element they are in. Every step that takes
an element accepts this.

```gherkin
* I click the "Delete" button in the "Order 1001" row
* I click the "Edit" link in the "Total" cell in the "Order 1001" row
```

### Elements without a name

Some elements show nothing to name them by, such as an icon-only button or a field without a
label. Give them a name in the file of their page, an alias: see
[pages](pages.md#elements-without-a-name-aliases). Often the better fix is in the app: an
element without a name is also hard to use with a screen reader.

## Checks

Steps that start with `I see` or `I do not see` are checks. They wait up to 5 seconds for the
page to get there, so a slow page does not fail the test by itself, and no test needs a fixed
pause.

"Contains" means the text can be part of a longer text, with the same spelling and capitals:
`I see the text "Welcome"` passes on "Welcome back!", but not on "welcome back!". Checks of a
field value, an address or "exactly the text" compare the whole value. Because capitals count,
a negative check passes when only the capitals differ: `I do not see the text "error"` passes on
a page that shows "Error". Write the text exactly as the page shows it.

| Step                                          | Passes when                                      |
| --------------------------------------------- | ------------------------------------------------ |
| `I see the "Log in" button`                   | the button is visible on screen                  |
| `I do not see the "Close" button`             | the button is hidden or not on the page at all   |
| `I see the text "Welcome back!"`              | some visible part of the page contains this text |
| `I see the text "Savings" in the "…" section` | that element contains the text                   |
| `I see the value "Jane" in the "Name" field`  | the field contains exactly this value            |
| `I see the "Log in" button is disabled`       | the button is shown but cannot be used           |
| `I see the url "/dashboard"`                  | the browser shows exactly this address           |

### Checks against a screenshot

`I see the page matches the screenshot "start.png"` compares the page with a stored screenshot.
The first run has none yet: it stores one and fails, and the runs after it compare. The file is
next to the feature file, in a folder named after the test Playwright makes from it, and
Playwright adds the browser and the operating system to the name:
`features/start.feature.spec.js-snapshots/start-chromium-darwin.png` on a Mac,
`start-chromium-linux.png` on Linux. Fonts look different on each system, so a screenshot made
on a Mac does not count on Linux, where CI usually runs: there the check fails once more and
stores its own. [Running in CI](setup.md#running-in-ci) says how to make the Linux screenshots.
After a change to the page that is meant, `npm test -- --update-snapshots` stores new ones.

## Before you run

`npm run lint` checks every feature file without opening a browser: steps that do not exist
(with the closest one that does), removed steps (with what replaces them), unknown pages and
values, selectors in quotes and fixed waits. VS Code marks steps that do not exist while you type, see
[editor support](ide-support.md). `npm test` runs the tests, and `npm run report` opens the
report. When an element is missing, the error lists what the page offers:

```
No "Sign in" button found on the "Login" page.
Buttons on this page: "Accept Cookies", "Log in".
```

## More

- [Pages](pages.md): give pages a name, and elements without a name an alias.
- [Test data](test-data.md): data files, passwords, values from earlier steps, data created
  through your app's API.
- [Keywords](keywords.md): your own steps, made of existing steps.
- [Logging in once](logging-in.md): start tests logged in.
- [Vocabulary rules](vocabulary.md): how steps are worded.
