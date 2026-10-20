# Migrating from Gauge

Gauge specs and Plainwright features look alike: both are lists of `*` steps with
values in double quotes. Most of a migration is renaming files and adjusting step wording.

## Concepts

| Gauge                                     | Plainwright                                                                 |
| ----------------------------------------- | --------------------------------------------------------------------------- |
| Specification (`.spec`, Markdown)         | Feature file (`.feature`, Gherkin)                                          |
| `# Spec heading`                          | `Feature: …`                                                                |
| `## Scenario heading`                     | `Scenario: …`                                                               |
| Context steps (before the first scenario) | `Background:`                                                               |
| Teardown steps (`___` at the end)         | `I delete "…" after the test` in a keyword; else fixtures or `After` hooks  |
| `* step "with" "params"`                  | `* step "with" "params"` (same)                                             |
| Concept (`.cpt` file)                     | Keyword: `Scenario Outline:` in `keywords/*.feature`                        |
| Concept parameter `<name>`                | Keyword parameter `"<name>"` (in quotes)                                    |
| Data table driving a scenario             | `Scenario Outline:` with `Examples:`                                        |
| Data store, environment properties        | `data/*.json` and environment variables, written `"{users.admin.email}"`    |
| Step implementation (Java, Python, …)     | Built-in steps; your own with `defineStep()` in TypeScript                  |
| Page object with selectors                | A file per page in `pages/`; selectors only as aliases for unnamed elements |
| Tags                                      | Tags (`@smoke`), run with `npm test -- --grep @smoke`                       |
| Gauge HTML report                         | Playwright HTML report with traces                                          |

## Step wording

Typical Gauge + Selenium setups name elements by page-object field (`"input user"`) and use
`type`. Plainwright names elements by what the user sees and uses `fill`.
`npx plainwright lint` suggests the closest existing step for every line that does not
match, which makes a first pass quick.

| Gauge                                                        | Plainwright                                     |
| ------------------------------------------------------------ | ----------------------------------------------- |
| `* I visit the url "/sign-in"`                               | `* I open the "Login" page`                     |
| `* I see the page "login"`                                   | `* I am on the "Login" page`                    |
| `* I type "1234567890" in the "input user"`                  | `* I fill "1234567890" in the "Username" field` |
| `* I click the "button login"`                               | `* I click the "Log in" button`                 |
| `* I not see the "button close modal"`                       | `* I do not see the "Close" button`             |
| `* I see the attribute "disabled" in element "button login"` | `* I see the "Log in" button is disabled`       |
| `* I see the url "/de"`                                      | `* I see the url "/de"`                         |

## Concepts become keywords

A Gauge concept becomes a keyword: a `Scenario Outline:` in `keywords/`, with the concept's
parameters in quotes. Files in `keywords/` load by themselves.

```markdown
# Login concepts (Gauge, login.cpt)

## I am logged in as <user>

- I visit the page login
- I type <user> in the "input user"
- I type "secret" in the "input password"
- I click the "button login"
```

```gherkin
# keywords/login.feature
Feature: Login

  Scenario Outline: I am logged in as "<user>"
    * I open the "Login" page
    * I fill "<user>" in the "Username" field
    * I fill "secret" in the "Password" field
    * I click the "Log in" button
```

## Test data and secrets

Do not commit real credentials in feature files. Gauge's table-driven data and environment
properties map to JSON files in `data/` and environment variables, both written inside the
quotes: `I fill "{users.standard.name}" in the "Username" field`,
`I fill "{env.TEST_PASSWORD}" in the "Password" field`. A `.env` file holds them locally. See
[test data](test-data.md#data-files).

## Migration checklist

1. Set up the project: see [getting started](../README.md#getting-started).
2. Add a file in `pages/` for every Gauge page object. Keep selectors only where the
   element has no visible name.
3. Convert specs to features (`#` → `Feature:`, `##` → `Scenario:`), concepts to keywords.
4. Run `lint` and fix the reported lines.
5. Run the tests and compare with the Gauge results.
