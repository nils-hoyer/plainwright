# Plainwright: contributor instructions

This repository is the Plainwright library: readable, keyword-driven browser tests on
top of playwright-bdd. (For instructions to give an assistant in a project that _uses_ the
library, see `templates/AGENTS.md`.)

## Layout

```
src/
  index.ts          public API; importing it registers the built-in steps and loads project files
  project.ts        loads .env, pages.json, data/ and keywords/ from the project folder
  registry.ts       defineStep / findStep: the single source of truth for steps; fills in {values}
  values.ts         defineData, remembered values and {references} inside quotes
  params.ts         {element} and {number} parameter types, defineParameterType
  elements.ts       element types and how each is located; missing-element hints
  pages.ts          definePage, definePages (pages.json) and aliases
  world.ts          per-scenario state: active tab, frame, page definition, dialogs, download,
                    last API response, actions after the test
  fixtures.ts       the Playwright `test` with the `world` fixture
  keywords.ts       defineKeywords: Scenario Outlines in .feature files become steps
  lint.ts, catalog.ts, docs.ts, inspect.ts, stubs.ts, cli.ts   the command line
  steps/*.steps.ts  built-in steps, one file per category
test/
  features/         end-to-end tests; they double as examples (no selectors allowed)
  keywords/         keywords used by the tests
  steps/            test setup: exported test, page definitions, keywords, data, a test helper step
  pages.json, data/ pages and test data, loaded by test/steps/
  test-app/         static pages served by test/server.mjs, which also has a small /api/orders
  unit/             vitest unit tests
```

## Rules for steps

Follow [docs/vocabulary.md](../docs/vocabulary.md): values in quotes, elements by visible name
plus type, one phrase per action, checks start with "I see" / "I do not see", no fixed waits in
core. Built-in steps only use the `world` fixture. Every step needs a one-sentence description
and an example that matches it and no other step (unit tests check this). `{name}` references
in quoted values are filled in by the registry before a step runs; a step never resolves them
itself.

## Before a pull request

`npm run verify` runs: prettier check, type check, docs check (`npm run docs` regenerates the
step tables in README.md), feature lint, unit tests and the Playwright tests.
