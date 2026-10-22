---
name: plainwright
description: Write, lint and fix readable browser tests (Gherkin feature files) with Plainwright. Use when adding or changing tests in features/.
---

<!-- Generated from templates/AGENTS.md by npm run docs. Copy to .claude/skills/plainwright/SKILL.md. -->

# Writing browser tests with Plainwright

Browser tests in this project are plain sentences in `features/**/*.feature` (Gherkin), run by
Playwright. People who do not program review them, so they must read like a description of what
a user does and sees.

Adjust the paths below if this project keeps features or steps elsewhere.

## Workflow

1. **Look up the vocabulary.** Run `npx plainwright catalog --out steps.json` and read
   `steps.json`. Use only steps listed there. Prefer steps with `"level": "core"`. Use the
   page names listed under `pages` and the data listed under `values`.
2. **Look at the real page.** Run `npx plainwright inspect "<page name or URL>"`.
   Use element names exactly as printed (`the "Log in" button`). If an element you need has no
   name, add an alias to the page's file in `pages/` instead of using a selector.
3. **Write the scenario** in an existing feature file or a new one. One scenario tests one thing;
   its title says what it shows.
4. **Lint:** `npx plainwright lint --features "features/**/*.feature"`.
   Fix every error. Unknown steps come with a suggestion.
5. **Run:** `npx plainwright test <feature file>`.
6. **If it fails,** read the error. A missing element lists the names the page offers
   (`Buttons on this page: …`), a missing text the similar texts on the page. The report has a
   "Fix with AI" attachment with the page structure. Playwright's `error-context.md` in
   `test-results/` has it too, but ignore its request for a code snippet. Fix the wording of
   the scenario, or add an alias. Do not change step definitions or the application to make a
   test pass; if the app seems wrong, say so.
7. **Hand over for review:** the feature file and the report (`npx playwright show-report`).

## Rules

- Every value is in double quotes. Anything in quotes is data; the rest of the sentence is fixed.
- Name elements by what the user sees, followed by the element type: `the "Log in" button`,
  `the "Email" field`, `the "Country" dropdown`. Never write CSS, XPath or test IDs.
- When a name repeats on the page, name the element it is in:
  `the "Delete" button in the "Order 1001" row`, `the "Toggle" checkbox in the "Buy milk" list item`.
- Open pages by name (`I open the "Login" page`) when the project defines them (`pages` in
  steps.json), otherwise by address relative to the base URL (`I open the url "/login"`).
- Checks start with `I see` / `I do not see` and wait on their own. There are no fixed waits;
  for an element that takes long, write `I see the "…" heading within "30" seconds`.
- Every scenario checks something: it ends with at least one `I see` step.
- Values from elsewhere are written in braces inside the quotes: `"{users.admin.email}"` from
  `data/users.json`, `"{env.TEST_PASSWORD}"` for secrets, `"{order.id}"` for a value an earlier
  step remembered, `"{unique}"` for a value that differs in every test, `"{today}"` or
  `"{in-7-days}"` for dates. A remembered value lasts for one scenario; data several scenarios
  need goes into `data/`. Never write passwords or other secrets into feature or data files.
- Shared test data goes into JSON files in `data/`. A named page is one file in `pages/`:
  `{ "name": "Orders", "url": "/orders" }`.
- Repeated sequences of steps become a keyword: a `Scenario Outline:` in `keywords/*.feature`
  whose title is the new step, with parameters written `"<name>"`. End a keyword with a check of
  where it leads, such as `I see the url "/dashboard"`, so the next step does not start early.
- When a feature tagged `@setup` ends with `I keep the session`, every scenario starts logged
  in: do not log in again. A scenario that needs a fresh browser, such as a test of the login
  itself, gets the tag `@logged-out`.
- Data a test needs first is a `Given` keyword such as `there is an order for "<item>"`: it
  creates the data with `I create "…" at "/api/…" with "{…}"` and removes it with
  `I delete "…" after the test`. Do not create test data by clicking through other screens when
  the app has an API for it. Requests (`I create …`, `I send a "…" request`,
  `I see the response …`) belong in keywords like this one, not in scenarios: a scenario says
  what a user does and sees.
- Do not invent steps. If nothing fits, propose a keyword. A TypeScript step (`defineStep()` with
  `description` and `example`) is only for what existing steps cannot express; ask first.

## Example

```gherkin
Feature: Login

  Background:
    * I open the "Login" page

  Scenario: A wrong password shows an error
    * I fill "1234567890" in the "Username" field
    * I fill "wrongpassword" in the "Password" field
    * I click the "Log in" button
    * I see the text "Username and password are incorrect."
    * I do not see the "Welcome back!" dialog
```
