# AI authoring

Plainwright is built so that an AI assistant can write tests and a person can review
them. The assistant needs three things: the list of steps that exist, the names on the real
page, and fast feedback. The person needs readable tests and a clear report.

## Set up the assistant

Copy the instructions into your project:

| Assistant           | Template                                                                  | Copy to                               |
| ------------------- | ------------------------------------------------------------------------- | ------------------------------------- |
| Any (AGENTS.md)     | [templates/AGENTS.md](../templates/AGENTS.md)                             | `AGENTS.md`                           |
| GitHub Copilot      | [templates/copilot-instructions.md](../templates/copilot-instructions.md) | `.github/copilot-instructions.md`     |
| Claude Code (skill) | [templates/claude-skill/SKILL.md](../templates/claude-skill/SKILL.md)     | `.claude/skills/plainwright/SKILL.md` |

The templates are in the installed package too: `node_modules/@nils.hoyer/plainwright/templates/`.
Adjust the `features/` and `steps/` paths if yours differ.

## The workflow: inspect → write → lint → run → review

**Catalog.** `npx plainwright catalog --out steps.json` writes every step with pattern,
description, example, level and parameters, plus element types, the design rules, your page
names and aliases, and the values from `data/` a step can write as `{users.admin.email}`. Project steps and keywords are included, with the
file and line where they are defined. Regenerate it when steps change, or keep it out of git
(`steps.json` is small and fast to build).

**Inspect.** `npx plainwright inspect "Login" --base-url http://localhost:3000`
opens the page in Chromium and lists buttons, fields, links, headings, dialogs and so on by the
names the steps use, plus how many elements of each type have no name. `--json` prints JSON,
`--storage-state auth.json` opens the page logged in.

**Lint.** `npx plainwright lint --features "features/**/*.feature"`
reports unknown steps with the closest existing step, ambiguous steps, unknown pages and values,
selectors, absolute URLs, fixed waits and broken keywords, as `file:line: severity: message (rule)`. Exit code 1 on errors,
so it can gate CI and agent loops.

**Run.** `npx bddgen && npx playwright test`. When an element is missing, the error lists the
elements of that type the page offers:

```
No "Sign in" button found on the "Login" page.
Buttons on this page: "Accept Cookies", "Log in".
```

**Review.** The person reads the feature file and opens the report. The
[reviewer guide](reading-tests.md) explains both in one page.

## "Fix with AI" attachment (evaluation)

playwright-bdd can attach a prompt to every failed test (`aiFix.promptAttachment`). We tried it
with Plainwright:

- **What it contains:** the scenario, the error, a code snippet of the failing step definition
  and the ARIA snapshot of the page. With Plainwright the error already includes the
  "Buttons on this page" hint, so the prompt is enough to fix a wrong element name.
- **Problem with the default prompt:** it tells the AI to change the step definition code and to
  use `getByRole` locators. For keyword tests the fix belongs in the feature file (wording) or in
  an alias, and the step code shown is library code.
- **Recommendation:** enable it with the template from this package, which keeps the AI on the
  feature file and the visible names, and drops the code snippet:

  ```ts
  import { aiFixPromptTemplate } from '@nils.hoyer/plainwright';

  defineBddConfig({
    // ...
    aiFix: { promptAttachment: true, promptTemplate: aiFixPromptTemplate },
  });
  ```

- **Limitation:** the snapshot is taken from the test's first tab. After `I switch to tab "2"`
  it may show the wrong tab.
