# Plainwright starter

Readable, keyword-driven Playwright tests against a small todo app in `app/`, which the
tests start themselves (`webServer` in `playwright.config.ts`). Nothing is fetched from the
internet while the tests run.

```bash
npm install
npx playwright install chromium
npm test          # generate and run the tests
npm run report    # open the report
```

## What is where

| Path                   | Contains                                                      |
| ---------------------- | ------------------------------------------------------------- |
| `features/`            | The tests, in plain sentences.                                |
| `keywords/`            | Your own steps, written in Gherkin (`I add the todo "…"`).    |
| `steps/pages.ts`       | Page names and aliases for elements without a visible name.   |
| `steps/todos.steps.ts` | Steps in TypeScript, for what other steps cannot express.     |
| `steps/fixtures.ts`    | The Playwright `test`, extended with your own fixtures.       |
| `AGENTS.md`            | Instructions for AI assistants writing tests here.            |
| `app/`                 | The example app the tests run against. Replace it with yours. |

## Useful commands

```bash
npm run lint                  # check feature files before running them
npm run catalog               # steps.json: every step, for people and AI assistants
npm run app                   # start the example app on http://localhost:3210
npm run inspect -- "Todos"    # with the app running: list the buttons, fields, links … of a page
npm run stubs                 # step file for editor autocomplete (see .vscode/settings.json)
```

To test your own app, set `baseURL` in `playwright.config.ts` to it, remove `webServer` (or
let it start your app) and change the pages in `steps/pages.ts`. Then delete `app/`.
See the [Plainwright README](https://github.com/nils-hoyer/plainwright#readme).
