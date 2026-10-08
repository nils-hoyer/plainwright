# Vocabulary rules

How steps are worded. These rules apply to built-in steps, project steps (`defineStep`) and
keywords. Step text is public API: renaming a step is a breaking change (see
[versioning](versioning.md)).

## The rules

1. **Every value is in double quotes.** Anything in quotes is data; the rest of the sentence is
   fixed. Numbers too: `I see "3" items in the "Cart" list`.
2. **Elements are named by what the user sees**, followed by an element type:
   `the "Log in" button`, `the "Email" field`. CSS, XPath and test IDs stay out of feature files.
   An element without a visible name gets an alias in its page definition.
3. **One phrase per action. No synonyms.** It is `fill`, never also `type` or `enter`.
4. **Every step does exactly what it says**, documented in one sentence.
5. **Checks start with `I see` / `I do not see`** and wait automatically. No fixed waits in the
   core vocabulary.
6. **Given/When/Then is optional**; `*` works everywhere.
7. **Step text is the public API.**

## Sentence patterns

| Kind              | Pattern                                      | Example                                                 |
| ----------------- | -------------------------------------------- | ------------------------------------------------------- |
| Action on element | `I <verb> the <element>`                     | `I click the "Log in" button`                           |
| Action with data  | `I <verb> "<data>" in the <element>`         | `I fill "Jane" in the "Name" field`                     |
| Check             | `I see the <element> [is <state>]`           | `I see the "Log in" button is disabled`                 |
| Check with data   | `I see the <what> "<data>" in the <element>` | `I see the text "Saved" in the "Status" section`        |
| Negative check    | `I do not see …`                             | `I do not see the "Close" button`                       |
| Page              | `I open / am on the "<page>" page`           | `I am on the "Dashboard" page`                          |
| Announcement      | `I <verb> the next <thing>`                  | `I accept the next dialog` (before the step causing it) |

Verbs in use: click, double click, right click, hover over, focus on, fill … in, clear, check,
uncheck, select … in, press, upload … with, drag … to, tap, scroll, switch to, open, go back,
reload, accept, dismiss, download, take a screenshot.

Element types: button, link, field, checkbox, radio button, dropdown, heading, tab, dialog,
menu item, image, section, list, element. See the [reviewer guide](reading-tests.md#element-types).

## Core and advanced

**Core** steps are the everyday vocabulary (about 35). A reviewer must understand all of them
after reading the [reviewer guide](reading-tests.md). Current core steps:

<!-- generated:core-steps -->

- `I open the "Login" page`
- `I am on the "Dashboard" page`
- `I go back`
- `I reload the page`
- `I click the "Log in" button`
- `I double click the "Double click me" button`
- `I hover over the "Hover over me" element`
- `I fill "1234567890" in the "Username" field`
- `I clear the "Full Name" field`
- `I check the "I accept the terms and conditions" checkbox`
- `I uncheck the "Subscribe to newsletter" checkbox`
- `I select "Germany" in the "Country" dropdown`
- `I press "Enter"`
- `I press "Enter" in the "Email" field`
- `I upload the file "test/test-app/test-file.txt" with the "Choose File" button`
- `I drag the "Drag Me" element to the "Drop Here" element`
- `I see the "Welcome to your Dashboard" heading`
- `I do not see the "Close" button`
- `I see the text "Welcome back!"`
- `I do not see the text "Username and password are incorrect."`
- `I see the text "Savings" in the "Account Overview" section`
- `I do not see the text "Loans" in the "Account Overview" section`
- `I see the value "Jane Doe" in the "Full Name" field`
- `I see "Germany" selected in the "Country" dropdown`
- `I see the "Full Name" field is empty`
- `I see the "Log in" button is enabled`
- `I see the "Log in" button is disabled`
- `I see the "I accept the terms and conditions" checkbox is checked`
- `I see the "Subscribe to newsletter" checkbox is not checked`
- `I see "3" items in the "Accounts" list`
- `I accept the next dialog`
- `I dismiss the next dialog`
- `I see a dialog with the message "Do you confirm?"`

<!-- /generated:core-steps -->

**Advanced** steps cover special cases: fixed waits, mouse coordinates, touch, frames, tabs,
cookies, storage, screenshots, downloads, HTML attributes and classes. They follow the same
rules. `lint` lists them as info, so a reviewer can spot them.

## Adding a step

1. Check that no step covers it. Combine steps into a [keyword](../README.md#keywords-your-own-steps-written-in-gherkin)
   first; a new step is for something steps cannot express.
2. Word it with the patterns above. Reuse existing verbs; do not add a synonym.
3. Define it with `defineStep()` including a one-sentence `description` and an `example` that
   matches this step and no other (the unit tests check this for built-in steps; `lint` checks
   project steps).
4. A new **core** step needs an issue and an update to the [reviewer guide](reading-tests.md).
   Otherwise make it `level: 'advanced'`.

## What lint checks

`npx playwright-keywords lint` prints `file:line: severity: message (rule)`:

| Rule               | Severity | Reports                                                  |
| ------------------ | -------- | -------------------------------------------------------- |
| `syntax`           | error    | invalid Gherkin                                          |
| `undefined-step`   | error    | a step that matches nothing, with the closest suggestion |
| `ambiguous-step`   | error    | a step that matches more than one definition             |
| `selector`         | error    | a quoted value that looks like CSS, XPath or a test ID   |
| `absolute-url`     | error    | a quoted absolute URL; use a page name or a relative URL |
| `keyword`          | error    | a broken keyword definition                              |
| `step-example`     | error    | a step whose example does not match it alone             |
| `discouraged-step` | warning  | fixed waits and other steps marked as discouraged        |
| `advanced-step`    | info     | an advanced step (hide with `--quiet`)                   |

The exit code is 1 when there are errors.
