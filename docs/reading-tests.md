# Reading tests

This page is for people who review tests without writing code. After reading it you can say
what a test checks and confirm the result in the report.

## A test is a list of sentences

- **Feature** names the area being tested. **Scenario** is one test. Its title says what it shows.
- **Background** steps run before every scenario of the feature.
- Each line starting with `*` is a **step**. Steps run from top to bottom. The test stops at the
  first step that fails.
- `Given`, `When`, `Then`, `And` may appear instead of `*`. They mean the same; they only help
  reading.
- Lines starting with `#` are comments.

```gherkin
Feature: Login

  Background:
    * I open the "Login" page

  Scenario: A wrong password shows an error
    * I fill "jane@example.com" in the "Email" field
    * I fill "wrong" in the "Password" field
    * I click the "Log in" button
    * I see the text "Email or password is incorrect."
```

## How a step is built

Everything in double quotes is **data**: text to type, a name on the screen, an expected value.
The rest of the sentence is **fixed** and means the same everywhere. In the step below:

- `I fill … in …` is the action.
- `"wrong"` is the text typed.
- `the "Password" field` is the element: its visible name, then its type.

> I fill **"wrong"** in the **"Password" field**

### Values from somewhere else

A name in braces inside the quotes is a **value from somewhere else**. In the report, a line
under the step shows the value used: `{users.admin.email} = "admin@example.com"`. Secrets show
as `(hidden)`.

- `{users.admin.email}` comes from the team's data file `data/users.json`: the `email` of
  `admin`.
- `{env.TEST_PASSWORD}` is a secret from the environment, such as a password.
- `{order.id}` is a value an earlier step remembered, for example with
  `I remember the text of the "Order number" field as "order"`, or the number the app gave a new
  order.
- `{unique}` is a text that differs in every test; `{today}` is today's date.

> I fill **"{users.admin.email}"** in the **"Email" field**

### Tables below a step

A step that ends with a colon takes a table: the lines starting with `|` below it. Each cell is
data, like a value in quotes, and may hold a value from somewhere else. `I fill the fields:` fills
the field named in the first column with the text in the second:

```gherkin
* I fill the fields:
  | Email    | jane@example.com |
  | Password | {env.TEST_PASSWORD} |
```

## Element types

The word after the name says what kind of element is meant. The test looks for an element of
that kind whose visible name is exactly the text in quotes (same spelling and capitals). Rows,
list items and messages are the exception: they are found by text they contain, because
their full text is long.

When several elements have the same name, the step says which one by naming the element it is
in: `the "Delete" button in the "Order 1001" row` is the "Delete" button in the table row that
contains "Order 1001". This can go further: `the "Edit" link in the "Total" cell in the "Order
1001" row`.

A team can give an element a name when the screen shows none (for example an icon-only button).
Such a name, an alias, is defined once in the page's file in `pages/`, which anyone on the team
can read and change.

<!-- generated:element-types -->

| Written as             | Finds                                                                                                |
| ---------------------- | ---------------------------------------------------------------------------------------------------- |
| `the "…" button`       | a button with this name                                                                              |
| `the "…" link`         | a link with this text                                                                                |
| `the "…" field`        | a text field with this label, or else this placeholder, the grey hint inside it                      |
| `the "…" checkbox`     | a checkbox with this label                                                                           |
| `the "…" radio button` | a radio button with this label                                                                       |
| `the "…" switch`       | a switch that turns something on or off, with this label                                             |
| `the "…" dropdown`     | a dropdown (select box) with this label                                                              |
| `the "…" option`       | an option to choose in an open list, such as a custom dropdown or search suggestions, with this text |
| `the "…" heading`      | a heading with this text                                                                             |
| `the "…" tab`          | a tab with this name                                                                                 |
| `the "…" dialog`       | a dialog or alert dialog with this title                                                             |
| `the "…" menu item`    | a menu item with this name, also one that can be ticked                                              |
| `the "…" image`        | an image with this alternative text or name                                                          |
| `the "…" section`      | an area of the page (landmark region) with this name                                                 |
| `the "…" list`         | a list with this name                                                                                |
| `the "…" list item`    | a list item that contains this text                                                                  |
| `the "…" row`          | a table row that contains this text, e.g. in its first cell                                          |
| `the "…" cell`         | a table cell with this text                                                                          |
| `the "…" message`      | a notice, such as a toast or an error banner, that contains this text                                |
| `the "…" element`      | any element showing exactly this text; mostly for names your team defined, called aliases            |

<!-- /generated:element-types -->

## What the checks mean

Steps that start with **`I see`** or **`I do not see`** are checks. They wait up to 5 seconds for
the page to get there, so a slow page does not fail the test by itself.

"Contains" means the text can be part of a longer text, with the same spelling and capitals:
`I see the text "Welcome"` passes on "Welcome back!", but not on "welcome back!". Checks of a field
value, a page address or "exactly the text" compare the whole value. Because capitals count, a
negative check passes when only the capitals differ: `I do not see the text "error"` passes on a
page that shows "Error". Write the text exactly as the page shows it.

| Step                                          | Passes when                                      |
| --------------------------------------------- | ------------------------------------------------ |
| `I see the "Log in" button`                   | the button is visible on screen                  |
| `I do not see the "Close" button`             | the button is hidden or not on the page at all   |
| `I see the text "Welcome back!"`              | some visible part of the page contains this text |
| `I see the text "Savings" in the "…" section` | that element contains the text                   |
| `I see the value "Jane" in the "Name" field`  | the field contains exactly this value            |
| `I see the "Log in" button is disabled`       | the button is shown but cannot be used           |
| `I am on the "Dashboard" page`                | the next steps use the names of that page        |

## Pages

`I open the url "/login"` opens this address of the app. `I open the "Login" page` opens the
address the team defined for the page "Login". After a click that leads to another page,
`I am on the "Dashboard" page` says which page the next steps are on, so that they use the names
the team defined for it. It checks nothing: `I see the url "/dashboard"` checks the address.
Page names keep web addresses out of the tests.

## Keywords

Some steps are **keywords**: a team-defined step made of other steps, for example
`I am logged in as "jane@example.com"`. Keywords are written in the same language in
`keywords/*.feature`, so you can read them too. In the report, a keyword shows its steps
nested underneath.

A `Given` line often says what exists before the test starts, such as
`Given there is an order for "Coffee"`. Its keyword creates that data through the app, usually
with `I create "…" at "/api/…"`, and removes it after the test with `I delete "…" after the test`.

## Steps to question

- Text in quotes that looks like code (`"#submit"`, `"//div[2]"`, `"[data-testid=…]"`): tests
  should name what the user sees.
- `I wait "2" seconds`: a fixed pause. Usually a check (`I see …`) should replace it.
- A scenario without any `I see` step: it does things, but checks nothing.

## Opening the report

After a test run, open the report with `npm run report` (or `npx playwright show-report`, or the
`playwright-report` folder your team shares, for example from a CI run).

- Every scenario is listed with ✓ (passed) or ✗ (failed).
- Open a scenario to see each step with its duration. A failed step is red and shows the error,
  for example `No "Sign in" button found. Buttons on this page: "Log in"`.
- **Screenshots** of failures are attached below the steps.
- **Trace**: click the trace to replay the test step by step, with a picture of the page before
  and after each step. Use it to confirm the test did what its sentences say.
