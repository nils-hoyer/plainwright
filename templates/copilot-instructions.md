<!-- Generated from templates/AGENTS.md by npm run docs. Copy to .github/copilot-instructions.md. -->

# Copilot instructions: browser tests

Browser tests in this project are plain sentences in `features/**/*.feature` (Gherkin), run by
Playwright. People who do not program review them, so they must read like a description of what
a user does and sees.

Adjust the paths below if this project keeps features or steps elsewhere.

## Workflow

1. **Look up the vocabulary.** Run
   `npx playwright-keywords catalog --steps "steps/**/*.ts" --out steps.json` and read
   `steps.json`. Use only steps listed there. Prefer steps with `"level": "core"`. Use the
   page names listed under `pages`.
2. **Look at the real page.** Run
   `npx playwright-keywords inspect "<page name or URL>" --steps "steps/**/*.ts" --base-url <base URL>`.
   Use element names exactly as printed (`the "Log in" button`). If an element you need has no
   name, add an alias to its `definePage()` in `steps/pages.ts` instead of using a selector.
3. **Write the scenario** in an existing feature file or a new one. One scenario tests one thing;
   its title says what it shows.
4. **Lint:** `npx playwright-keywords lint --features "features/**/*.feature" --steps "steps/**/*.ts"`.
   Fix every error. Unknown steps come with a suggestion.
5. **Run:** `npx bddgen && npx playwright test <feature file>`.
6. **If it fails,** read the error. A missing element lists the names the page offers
   (`Buttons on this page: …`). The report has a "Fix with AI" attachment with the page
   structure. Fix the wording of the scenario, or add an alias. Do not change step
   definitions or the application to make a test pass; if the app seems wrong, say so.
7. **Hand over for review:** the feature file and the report (`npx playwright show-report`).

## Rules

- Every value is in double quotes. Anything in quotes is data; the rest of the sentence is fixed.
- Name elements by what the user sees, followed by the element type: `the "Log in" button`,
  `the "Email" field`, `the "Country" dropdown`. Never write CSS, XPath or test IDs.
- Open pages by name (`I open the "Login" page`), not by URL.
- Checks start with `I see` / `I do not see` and wait on their own. Never add fixed waits
  (`I wait "2" seconds`).
- Every scenario checks something: it ends with at least one `I see` step.
- Repeated sequences of steps become a keyword: a `Scenario Outline:` in `keywords/*.feature`
  whose title is the new step, with parameters written `"<name>"`.
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
