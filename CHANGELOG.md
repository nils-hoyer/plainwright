# Changelog

All notable changes are listed here, breaking changes first. Step text is public API; see the
[versioning policy](docs/versioning.md).

## [0.1.0] - Unreleased

First release as **playwright-keywords** (the earlier, unpublished `playwright-bdd-steps` code
in this repository is replaced).

### Breaking (compared with the repository before the rename)

- Elements are named by what the user sees plus a type word (`the "Log in" button`) instead of
  page-object labels and selectors (`the "button login"`, `the "#submit"`). Selectors are only
  allowed as aliases in `definePage()`.
- `BasePage`, camelCase page-object lookup, `resolveSelector` and `labelToPropertyName` are
  removed. Use `definePage(name, { url, elements })`.
- Numbers are quoted like every other value: `I switch to tab "2"`, `I wait "2" seconds`.
- Every check starts with `I see` / `I do not see`, e.g. `the "x" is disabled` →
  `I see the "x" button is disabled`, `the url contains "x"` → `I see the url containing "x"`.
- Synonyms removed: `I type {string} in the {string}` → `I fill`, `I navigate to` /
  `I visit the url` → `I open the url`, `I press the key` → `I press`,
  `I clear and fill` → `I fill`, `I wait for the element … to be …` → `I see …`.
- Dialog steps are announcements: `I accept the next dialog` before the step that opens it.
- `I upload the file … to …` and `I click … and set the file(s) …` are one step:
  `I upload the file {string} with the {element}`.
- Steps for DOM details that reviewers cannot see were removed: attached to the DOM, CSS
  property, DOM ID, role, accessible name (covered by element types), JS property, full class
  attribute, URL of a download.
- `I take a screenshot …` attaches the screenshot to the report instead of writing to
  `test-results/`.
- Requires Node.js 22+, Playwright 1.53+ and playwright-bdd 9.

### Added

- Step registry: `defineStep({ pattern, description, example, category, level, fn })`,
  `findStep`, `findSteps`, `getSteps`. Built-in steps are `core` (33) or `advanced`.
- `{element}` parameter type with 14 element types, resolved by role, label, placeholder, alt
  text or text; exact names by default (`exactNames` option).
- Errors for missing elements list the elements of that type on the page.
- `definePage()` with aliases (by name, or by name and type).
- `I open the {string} page`, `I am on the {string} page`.
- Keywords in Gherkin: `defineKeywords('keywords/**/*.feature')`, checked before tests run,
  nested in the report with locations in the keyword file.
- CLI `playwright-keywords`: `lint`, `catalog` (steps.json), `docs`, `inspect`, `stubs`.
- `aiFixPromptTemplate` for playwright-bdd's "Fix with AI" attachment.
- Agent instruction templates (AGENTS.md, Copilot, Claude skill), reviewer guide, vocabulary
  rules, guides for Gauge and Robot Framework users, starter example.
