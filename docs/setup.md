# Setup

This page is for whoever sets up Plainwright for a project, usually once: a developer or a QA
engineer. After that, people write tests in feature files without touching any of this.

## What init does

[Getting started](../README.md#getting-started) is one command, in an empty folder or in your
project. It asks for the address of your app and which AI assistant you use, and then:

- installs `@nils.hoyer/plainwright`, `playwright-bdd`, `@playwright/test` and Chromium, with
  the package manager of the project (npm, pnpm, Yarn or Bun);
- writes the files listed [below](#files-init-writes);
- adds the scripts `test`, `report`, `lint` and `inspect` to `package.json` (see
  [commands](commands.md));
- asks whether to run the first test now, and runs it.

It never overwrites a file. Running it again adds only what is missing and says what it
skipped. In a project with its own Playwright configuration, it prints the lines to add. With
[options](#init-options), it sets up a project without questions, for CI or an AI assistant.

```bash
# Set up the project, asking for the address and the assistant
npx @nils.hoyer/plainwright@latest init

# The same without questions
npx @nils.hoyer/plainwright init --yes --url http://localhost:3000 --ai agents
```

To try Plainwright with an example app first, the [starter](../examples/starter) is a complete
project with a small todo app. This copies only its folder, without the rest of the
repository:

```bash
npx degit nils-hoyer/plainwright/examples/starter plainwright-starter
cd plainwright-starter
npm install
npm test
```

### Files init writes

| File                        | Contains                                                                |
| --------------------------- | ----------------------------------------------------------------------- |
| `playwright.config.ts`      | the address of your app, see [the configuration](#the-configuration)    |
| `features/example.feature`  | a first test that checks what your start page shows                     |
| `pages/start.json`          | the start page, see [pages](pages.md); see below for Next.js and Nuxt   |
| `keywords/example.feature`  | a commented example, see [keywords](keywords.md)                        |
| `AGENTS.md` or another file | instructions for your AI assistant, see [AI authoring](ai-authoring.md) |
| `.vscode/`                  | editor settings, see [editor support](ide-support.md)                   |
| `.gitignore`                | report folders, the login session and `.env`                            |

In Next.js, Nuxt and other frameworks, `pages/` holds the app's own files, so Plainwright loads
no pages from it. `init` then writes no `pages/start.json`, and the first test opens your app
by its address, with `I open the url`. To name pages in such a project, keep their files in another folder
and load it with `definePages('<folder>')` in a file in `steps/`.

### init options

| Option             | Meaning                                                       |
| ------------------ | ------------------------------------------------------------- |
| `--url <address>`  | The address of your app, instead of asking.                   |
| `--ai <assistant>` | `agents` (AGENTS.md), `copilot`, `claude` or `none`.          |
| `--yes`, `-y`      | Take the defaults for everything not given, and run the test. |
| `--dry-run`        | Only list what would change.                                  |
| `--no-install`     | Do not install packages and Chromium.                         |
| `--no-run`         | Do not run the first test.                                    |

## The configuration

`playwright.config.ts` needs one line besides the address of your app. `defineConfig()` sets up
what Plainwright needs: tests in `features/`, your own steps (if any) in `steps/`,
Plainwright's ready-made steps, Chromium ([other browsers](#other-browsers-and-phones)), the
[options](#options), and a "Fix with AI" prompt for failed tests in the report. Every
[Playwright option](https://playwright.dev/docs/test-configuration) can be added or changed, for
example `webServer` to start your app, as in the second example. The table lists the keys
`defineConfig()` adds.

```ts
import { defineConfig } from '@nils.hoyer/plainwright/config';

export default defineConfig({
  // The address of your app. "/login" in a test means http://localhost:3000/login
  baseURL: 'http://localhost:3000',
});
```

```ts
export default defineConfig({
  baseURL: 'http://localhost:3000',
  webServer: { command: 'npm run start', url: 'http://localhost:3000' },
  use: { exactNames: false },
});
```

| Option     | Default                 | Meaning                                                                                           |
| ---------- | ----------------------- | ------------------------------------------------------------------------------------------------- |
| `baseURL`  | none                    | Address of the app.                                                                               |
| `features` | `features/**/*.feature` | Where the tests are.                                                                              |
| `steps`    | `steps/**/*.{ts,js}`    | Your steps in TypeScript or JavaScript.                                                           |
| `bdd`      | none                    | More [playwright-bdd options](https://vitalets.github.io/playwright-bdd/#/configuration/options). |

### How the tests run

`npm test` runs `plainwright test`: it turns the feature files into Playwright tests (playwright-bdd's
`bddgen`) and runs them (`playwright test`). Options such as `--headed`, `--ui` or a file name go
to Playwright: `npm test -- --headed`.

Pages in `pages/`, test data in `data/`, keywords in `keywords/` and a `.env` file load by
themselves from the project folder. More in [pages](pages.md), [test data](test-data.md) and [keywords](keywords.md).

## Options

Set them under `use` in `playwright.config.ts`. Checks (`I see …`) wait up to 5 seconds,
Playwright's `expect.timeout`.

| Option          | Default                                            | Meaning                                                                                                                |
| --------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `baseURL`       | none                                               | Address of the app. Page addresses and `I open the url "/…"` are relative to it.                                       |
| `exactNames`    | `true`                                             | Element names must match exactly, with the same capitals. `false` also accepts part of a name, any capitals.           |
| `actionTimeout` | 10 s (`defineConfig()`), else none                 | How long a click or fill waits for its element. A missing element fails soon and the error lists what the page offers. |
| `trace`         | `retain-on-failure` (`defineConfig()`), else `off` | `retain-on-failure` keeps a replay of every failed test in the report.                                                 |

## Other environments

Addresses are relative to `baseURL`. Read it from an environment variable to run the same tests
against another environment:

```ts
export default defineConfig({
  baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
});
```

```bash
BASE_URL=https://staging.example.com npm test
```

## Other browsers and phones

`defineConfig()` runs the tests in Chromium. For Firefox, WebKit (the engine of Safari) or a
phone, add `projects` to `playwright.config.ts`: each project runs the tests once, in its browser.
Your `projects` replace the default one, so the list names Chromium too. Playwright's `devices`
have the settings of common browsers and phones; a phone such as `devices['iPhone 13']` has its
screen size, a touch screen and a mobile browser.

Scenarios that only make sense on a phone, such as a menu that only small screens show, get a tag
such as `@mobile`. The phone project runs only those (`grep`), and the others leave them out
(`grepInvert`). Without the tags, every scenario runs on every project.

```ts
import { devices } from '@playwright/test';
import { defineConfig } from '@nils.hoyer/plainwright/config';

export default defineConfig({
  baseURL: 'http://localhost:3000',
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] }, grepInvert: /@mobile/ },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] }, grepInvert: /@mobile/ },
    { name: 'webkit', use: { ...devices['Desktop Safari'] }, grepInvert: /@mobile/ },
    { name: 'phone', use: { ...devices['iPhone 13'] }, grep: /@mobile/ },
  ],
});
```

```gherkin
@mobile
Feature: Menu on a phone

  Scenario: The menu opens with a tap
    * I open the url "/"
    * I tap the "Menu" button
    * I see the "Orders" link
```

`init` installs only Chromium. Install the other browsers once, and add them to the install step
of the [CI workflow](#running-in-ci): `npx playwright install --with-deps chromium firefox webkit`.
An iPhone runs in WebKit, an Android phone such as `devices['Pixel 7']` in Chromium. Screenshots
to compare against are stored per project, such as `start-firefox-linux.png` next to
`start-chromium-linux.png`, so the first run of a new project stores its own (see
[writing tests](writing-tests.md#checks-against-a-screenshot)). To run one project, name it:

```bash
npx playwright install firefox webkit
npm test -- --project firefox
```

A window size of your own goes into `use`, for example
`use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 1024 } }` for a project that
checks the layout of a tablet. There is no step that changes the window size during a test: a
phone's touch screen and mobile browser are set when the browser opens, so such a step could only
change the size of the window, not make it a phone.

## Running in CI

The tests run like any Playwright tests; below is a GitHub Actions workflow. Secrets come from
the repository's secrets, as environment variables; there is no `.env` file in CI. The report
does not open by itself in CI: download the `playwright-report` artifact of the run and open its
`index.html`. If your app must run for the tests, start it with `webServer` in the
configuration (see [above](#the-configuration)). For JUnit or Cucumber reports, which CI servers
and test management tools read, see [reports for CI](reports-for-ci.md).

Screenshots to compare against, from `I see the page matches the screenshot "…"`, are stored
per operating system (see [writing tests](writing-tests.md#checks-against-a-screenshot)). CI on
Linux needs its own: make them in Playwright's Linux image and commit them. Use the image of
the Playwright version in your project (`npx playwright --version`). The tests run inside the
image, so an app on your computer is at `host.docker.internal` there instead of `localhost`;
an app that `webServer` starts runs inside the image too.

```bash
docker run --rm -v "$PWD":/work -v /work/node_modules -w /work \
  mcr.microsoft.com/playwright:v1.64.0-noble \
  sh -c "npm ci && npx plainwright test --update-snapshots"
```

```yaml
# .github/workflows/tests.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version: lts/*
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run lint
      - run: npm test
        env:
          TEST_PASSWORD: ${{ secrets.TEST_PASSWORD }}
      - uses: actions/upload-artifact@v7
        if: ${{ !cancelled() }}
        with:
          name: playwright-report
          path: playwright-report/
```

## With your own Playwright configuration

A project that already has a `playwright.config.ts` can keep it and add playwright-bdd: install
the packages and add `defineBddConfig()` as below. Then run the tests with
`npx plainwright test`. To keep other Playwright tests next to the feature files, give each its
own entry in `projects`, with its own `testDir`.

```bash
npm install --save-dev @nils.hoyer/plainwright playwright-bdd @playwright/test
npx playwright install chromium
```

```ts
import { defineConfig } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';
import { aiFixPromptTemplate, steps } from '@nils.hoyer/plainwright';

const testDir = defineBddConfig({
  features: 'features/**/*.feature',
  // Your own steps, if any, and Plainwright's ready-made steps.
  steps: ['steps/**/*.ts', steps],
  // Failed tests get a "Fix with AI" prompt in the report.
  aiFix: { promptAttachment: true, promptTemplate: aiFixPromptTemplate },
});

export default defineConfig({
  testDir,
  use: { baseURL: 'http://localhost:3000', actionTimeout: 10_000, trace: 'retain-on-failure' },
});
```

## Logging in

If most tests start logged in, log in once per run and reuse the session: see
[logging in once](logging-in.md).
