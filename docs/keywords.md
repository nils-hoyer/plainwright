# Keywords

Steps you repeat become a keyword: your own step, made of existing steps. You write it in a
feature file, so no programming is needed, and reviewers can read it like any test.

## Writing a keyword

A keyword is a `Scenario Outline:` in a file in `keywords/`. The title is the new step, and each
`"<name>"` in it is a value you fill in when you use it. Any test can then use it like a
built-in step. The report shows the four login steps nested under `I log in as …`, and errors
point to the line in the keyword file.

- The text under the title says what the keyword does. It appears in the
  [step reference](commands.md#docs-all-steps-as-markdown), the catalog for AI assistants and
  the editor.
- The first `Examples` row is the keyword's example. The `Examples` table is optional.
- Files in `keywords/` load by themselves.
- Keywords can use other keywords, [pages](pages.md) and [test data](test-data.md), such as
  `"{users.admin.email}"`. A keyword that creates data through your app's API is shown in
  [data a test creates first](test-data.md#data-a-test-creates-first).

```gherkin
# keywords/account.feature
Feature: Account

  Scenario Outline: I log in as "<username>" with password "<password>"
    Opens the login page and logs in.

    * I open the url "/login"
    * I fill "<username>" in the "Username" field
    * I fill "<password>" in the "Password" field
    * I click the "Log in" button

    Examples:
      | username | password |
      | jane     | secret   |
```

```gherkin
# features/orders.feature
Feature: Orders

  Scenario: Delete an order
    * I log in as "jane" with password "secret"
    * I open the url "/orders"
    * I click the "Delete" button in the "Order 1001" row
    * I see the "Order 1001 deleted" message
```

## Parameters

A `<name>` in the keyword's steps is replaced by the value only when `name` is a parameter in
the title. Any other `<…>`, such as `"<b>bold</b>"`, is text and stays as written; `lint` warns
when it looks like a misspelled parameter. Values arrive unchanged, backslashes included.

## Checks before any test runs

Each step of a keyword must match exactly one step, every parameter must be used, keywords must
not call each other in a loop, and the title must not match another step. A broken keyword
fails with its file and line, and `npm run lint` reports the same.

Word the title like any other step, following the [vocabulary rules](vocabulary.md): values in
double quotes, one verb per action.

## Limits

- Steps inside keywords must be built-in steps, keywords, or steps defined with
  `defineStep()`. Steps defined directly with playwright-bdd's `Given`/`When`/`Then` are unknown
  to keywords and lint.
- Steps that use your own [fixtures](writing-steps.md#fixtures) cannot be used inside keywords,
  which only pass `page` and `world`. All built-in steps work.
- Data tables in keywords are not supported yet.

## Keywords in another folder

Keywords outside `keywords/` need one line in a step file:

```ts
// steps/keywords.ts
import { defineKeywords } from '@nils.hoyer/plainwright';

defineKeywords('other/folder/**/*.feature');
```
