# AI authoring

Plainwright is built so that an AI assistant can write tests and a person can review them. The
assistant needs three things: the list of steps that exist, the names on the real page, and
fast feedback. The person needs readable tests and a clear report.

## Set up the assistant

`npx @nils.hoyer/plainwright init` asks which assistant you use and writes its instructions.
They tell the assistant the workflow below and the rules for steps. To copy them by hand, use
the templates below; they are in the installed package too, in
`node_modules/@nils.hoyer/plainwright/templates/`. Adjust the `features/` and `steps/` paths if
yours differ.

| Assistant           | Template                                                                  | Copy to                               |
| ------------------- | ------------------------------------------------------------------------- | ------------------------------------- |
| Any (AGENTS.md)     | [templates/AGENTS.md](../templates/AGENTS.md)                             | `AGENTS.md`                           |
| GitHub Copilot      | [templates/copilot-instructions.md](../templates/copilot-instructions.md) | `.github/copilot-instructions.md`     |
| Claude Code (skill) | [templates/claude-skill/SKILL.md](../templates/claude-skill/SKILL.md)     | `.claude/skills/plainwright/SKILL.md` |

## Asking for a test

Describe what the test should show, as you would to a colleague. The page and the expected
result are enough. The assistant then looks up the steps, opens the page, writes the scenario,
lints and runs it, and fixes what fails. It shows you the feature file to review. Larger
requests work the same way: "Cover the checkout: an order with two products, a wrong voucher
code, and an empty cart." For steps that repeat, ask for a [keyword](keywords.md).

A request and the feature file it gives:

> Write a test for the login page: a wrong password shows the error "Email or password is
> incorrect.". The app runs on http://localhost:3000.

```gherkin
Feature: Login

  Scenario: A wrong password shows an error
    * I open the "Login" page
    * I fill "jane@example.com" in the "Email" field
    * I fill "wrong" in the "Password" field
    * I click the "Log in" button
    * I see the text "Email or password is incorrect."
```

## The workflow: catalog → inspect → write → lint → run → review

**Catalog.** `npx plainwright catalog --out steps.json` writes every step with pattern,
description, example, level and parameters, plus element types, the wording rules, your page
names and aliases, and the values from `data/` a step can write as `{users.admin.email}`.
Project steps and keywords are included, with the file and line where they are defined.
Regenerate it when steps change, or keep it out of git (`steps.json` is small and fast to
build).

**Inspect.** `npx plainwright inspect "Login"` opens the page in Chromium and lists buttons,
fields, links, headings, dialogs and so on by the names the steps use, plus how many elements of
each type have no name. `--json` prints JSON, `--storage-state auth.json` opens the page logged
in.

**Write.** The assistant writes the scenario with steps from the catalog and names from
`inspect`, following the rules in its instructions: values in quotes, elements by their visible
name, checks with `I see`, no selectors and no fixed waits. An element without a name gets an
alias in its [page file](pages.md), not a selector in the test.

**Lint.** `npx plainwright lint --features "features/**/*.feature"` reports unknown steps with
the closest existing step, steps Plainwright leaves out with what to write instead, ambiguous steps, unknown pages
and values, selectors, absolute URLs, fixed waits and broken keywords, as
`file:line: severity: message (rule)`. Exit code 1 on errors, so it can gate CI and agent loops.

**Run.** `npx plainwright test`. When an element is missing, the error lists the elements of
that type the page offers, as in the example below.

**Review.** The person reads the feature file and opens the report. The
[reviewer guide](reading-tests.md) explains both in one page.

```
No "Sign in" button found on the "Login" page.
Buttons on this page: "Accept Cookies", "Log in".
```

## "Fix with AI" in the report

Every failed test in the report has a "Fix with AI" prompt: the scenario, the error and the
structure of the page, ready to paste into an assistant. With Plainwright the error already
includes the "Buttons on this page" hint, so the prompt is usually enough to fix a wrong
element name. Plainwright's prompt keeps the assistant on the feature file and the visible
names, instead of changing step code.

`defineConfig()` turns it on. With your own Playwright configuration, add it to
`defineBddConfig()`. One limit: the page structure is taken from the test's first tab, so after
`I switch to tab "2"` it may show the wrong tab.

```ts
import { aiFixPromptTemplate } from '@nils.hoyer/plainwright';

defineBddConfig({
  // ...
  aiFix: { promptAttachment: true, promptTemplate: aiFixPromptTemplate },
});
```
