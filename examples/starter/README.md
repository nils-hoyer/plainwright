# playwright-keywords starter

Readable, keyword-driven Playwright tests against the
[TodoMVC demo](https://demo.playwright.dev/todomvc/).

```bash
npm install
npx playwright install chromium
npm test          # generate and run the tests
npm run report    # open the report
```

## What is where

| Path                   | Contains                                                    |
| ---------------------- | ----------------------------------------------------------- |
| `features/`            | The tests, in plain sentences.                              |
| `keywords/`            | Your own steps, written in Gherkin (`I add the todo "…"`).  |
| `steps/pages.ts`       | Page names and aliases for elements without a visible name. |
| `steps/todos.steps.ts` | Steps in TypeScript, for what other steps cannot express.   |
| `steps/fixtures.ts`    | The Playwright `test`, extended with your own fixtures.     |
| `AGENTS.md`            | Instructions for AI assistants writing tests here.          |

## Useful commands

```bash
npm run lint                  # check feature files before running them
npm run catalog               # steps.json: every step, for people and AI assistants
npm run inspect -- "Todos"    # list the buttons, fields, links … of a page by name
npm run stubs                 # step file for editor autocomplete (see .vscode/settings.json)
```

To test your own app, change `baseURL` in `playwright.config.ts` and the pages in
`steps/pages.ts`. See the [playwright-keywords README](https://github.com/nils-hoyer/playwright-keywords#readme).
