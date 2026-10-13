# Plainwright compared

## With other tools

| Compared with                                                       | Difference                                                                                                                                             |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Plain Playwright                                                    | Same runner, locators and report. Tests are sentences instead of TypeScript, so reviewers need no code; you trade some freedom for a fixed vocabulary. |
| [Playwright's test agents](https://playwright.dev/docs/test-agents) | They write and repair TypeScript tests. Here an assistant writes sentences, limited to steps that exist and names on the page, and lint checks them.   |
| [playwright-bdd](https://github.com/vitalets/playwright-bdd) alone  | You write every step definition. Plainwright adds ~100 ready steps, elements by role and name, keywords in Gherkin and the lint/catalog/inspect tools. |
| [Robot Framework Browser](https://robotframework-browser.org/)      | Also keyword-driven on Playwright, with its own syntax, runner and report. Here: Gherkin, TypeScript projects and Playwright's own runner and report.  |
| [Gauge](https://gauge.org/)                                         | Markdown specs and concepts with its own runner. Keywords play the role of concepts; see [migrating from Gauge](migrating-from-gauge.md).              |

Moving over: [migrating from Gauge](migrating-from-gauge.md),
[coming from Robot Framework](coming-from-robot-framework.md).

## For Playwright users

- **Real Playwright underneath.** Elements are found with `getByRole`, `getByLabel` and
  `getByText`, checks are web-first assertions that wait, and you keep traces, the HTML report,
  projects, fixtures and the native runner. It is not a Selenium-style wrapper.
- **Accessible names by default.** Elements are named by what the user sees, matched exactly.
  Aliases with selectors are the exception, which pushes apps toward accessibility. How each
  type is found: [setup](setup.md#how-element-types-are-found).
- **Errors say what the page offers,** built from `ariaSnapshot()`:
  `No "Sign in" button found. Buttons on this page: "Accept Cookies", "Log in".`
- **Your fixtures and steps still work.** `useTest()` binds your extended `test`, and
  `defineStep()` adds TypeScript steps that docs, lint and keywords know. See
  [your own steps](writing-steps.md).
- **Step text is versioned like an API.** Core and advanced steps, discouraged steps with a reason
  that lint shows, and a step reference generated from the code and checked in CI. See the
  [versioning policy](versioning.md).
