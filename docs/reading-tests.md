# Reading tests

This page is for people who review tests without writing code. After reading it you can say
what a test checks and confirm the result in the report.

## A test is a list of sentences

```gherkin
Feature: Login

  Background:
    * I open the "Login" page

  Scenario: A wrong password shows an error
    * I fill "1234567890" in the "Username" field
    * I fill "wrongpassword" in the "Password" field
    * I click the "Log in" button
    * I see the text "Username and password are incorrect."
```

- **Feature** names the area being tested. **Scenario** is one test. Its title says what it shows.
- **Background** steps run before every scenario of the feature.
- Each line starting with `*` is a **step**. Steps run from top to bottom. The test stops at the
  first step that fails.
- `Given`, `When`, `Then`, `And` may appear instead of `*`. They mean the same; they only help
  reading.
- Lines starting with `#` are comments.

## How a step is built

Everything in double quotes is **data**: text to type, a name on the screen, an expected value.
The rest of the sentence is **fixed** and means the same everywhere.

> I fill **"wrongpassword"** in the **"Password" field**

- `I fill … in …` is the action.
- `"wrongpassword"` is the text typed.
- `the "Password" field` is the element: its visible name, then its type.

## Element types

The word after the name says what kind of element is meant. The test looks for an element of
that kind whose visible name is exactly the text in quotes (same spelling and capitals).

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

A team can give an element a name when the screen shows none (for example an icon-only button).
Such names are defined once per page by the developers.

## What the checks mean

Steps that start with **`I see`** or **`I do not see`** are checks. They wait up to 5 seconds for
the page to get there, so a slow page does not fail the test by itself.

| Step                                          | Passes when                                      |
| --------------------------------------------- | ------------------------------------------------ |
| `I see the "Log in" button`                   | the button is visible on screen                  |
| `I do not see the "Close" button`             | the button is hidden or not on the page at all   |
| `I see the text "Welcome back!"`              | some visible part of the page contains this text |
| `I see the text "Savings" in the "…" section` | that element contains the text                   |
| `I see the value "Jane" in the "Name" field`  | the field contains exactly this value            |
| `I see the "Log in" button is disabled`       | the button is shown but cannot be used           |
| `I am on the "Dashboard" page`                | the browser shows the address of that page       |

"Contains" means the text can be part of a longer text, with the same spelling and capitals:
`I see the text "Welcome"` passes on "Welcome back!", but not on "welcome back!". Checks of a field
value, a page address or "exactly the text" compare the whole value.

Because capitals count, a negative check passes when only the capitals differ:
`I do not see the text "error"` passes on a page that shows "Error". Write the text exactly as
the page shows it.

## Pages

`I open the "Login" page` opens the address the team defined for "Login". Page names keep web
addresses out of the tests.

## Keywords

Some steps are **keywords**: a team-defined step made of other steps, for example
`I log in as "1234567890" with password "secret"`. Keywords are written in the same language in
`keywords/*.feature`, so you can read them too. In the report, a keyword shows its steps
nested underneath.

## Steps to question

- Text in quotes that looks like code (`"#submit"`, `"//div[2]"`, `"[data-testid=…]"`): tests
  should name what the user sees.
- `I wait "2" seconds`: a fixed pause. Usually a check (`I see …`) should replace it.
- A scenario without any `I see` step: it does things, but checks nothing.

## Opening the report

After a test run, open the report with `npx playwright show-report` (or the `playwright-report`
folder your team shares).

- Every scenario is listed with ✓ (passed) or ✗ (failed).
- Open a scenario to see each step with its duration. A failed step is red and shows the error,
  for example `No "Sign in" button found. Buttons on this page: "Log in"`.
- **Screenshots** of failures are attached below the steps.
- **Trace**: click the trace to replay the test step by step, with a picture of the page before
  and after each step. Use it to confirm the test did what its sentences say.
