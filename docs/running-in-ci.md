# Running in CI

This page is for whoever sets up the test runs in CI. The tests run like any Playwright tests:
below are a workflow for GitHub Actions, screenshots for Linux, and the reports that CI servers
and test management tools read.

## A workflow for GitHub Actions

Secrets come from the repository's secrets, as environment variables; there is no `.env` file
in CI. If your app must run for the tests, start it with `webServer` in the configuration (see
[the configuration](setup.md#the-configuration)). The report does not open by itself in CI:
download the `playwright-report` artifact of the run and open its `index.html`.

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

To run the tests in [other browsers](setup.md#other-browsers-and-phones), install them in the
same step: `npx playwright install --with-deps chromium firefox webkit`.

## Screenshots on Linux

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

## Reports for CI servers

A run writes two reports by itself: the list in the terminal and the HTML report in
`playwright-report/`, which shows every step and replays failed tests. CI servers and test
management tools read other formats: JUnit XML or Cucumber JSON.

### Which format for which tool

| Tool                                                              | Reads         | Reporter                   |
| ----------------------------------------------------------------- | ------------- | -------------------------- |
| Jenkins, GitLab CI, Azure DevOps                                  | JUnit XML     | `junit` (Playwright's own) |
| Test management in Jira, such as Xray                             | Cucumber JSON | `cucumberReporter('json')` |
| Jenkins with the Cucumber Reports plugin                          | Cucumber JSON | `cucumberReporter('json')` |
| People who want the scenarios on one page, as Cucumber shows them | Cucumber HTML | `cucumberReporter('html')` |

Playwright's `junit` reporter is the one to start with: every CI server reads it, and each
scenario is one test case, named after its feature and scenario. `cucumberReporter` writes
Cucumber's formats, with every step of a scenario and its tags. It is playwright-bdd's
[Cucumber reporter](https://vitalets.github.io/playwright-bdd/#/reporters/cucumber), and takes
the same options.

### Adding a report

A `reporter` in `playwright.config.ts` replaces the two reports Plainwright sets, so list them
again next to the new ones. `noCopyPrompt` keeps the report's "Fix with AI" prompt, which asks to
fix the scenario, instead of Playwright's "Copy prompt", which asks for code. Write the files to a
folder of their own, such as `reports/`, and add it to `.gitignore`. Not to `test-results/`:
Playwright empties that folder when a run starts, after the Cucumber reports have opened their
files, so they would be gone.

```ts
import { cucumberReporter, defineConfig } from '@nils.hoyer/plainwright/config';

export default defineConfig({
  baseURL: 'http://localhost:3000',
  reporter: [
    // The two reports Plainwright sets by itself.
    ['list'],
    ['html', { noCopyPrompt: true }],
    // For the CI server.
    ['junit', { outputFile: 'reports/junit.xml' }],
    // For tools that read Cucumber JSON.
    cucumberReporter('json', { outputFile: 'reports/cucumber.json' }),
  ],
});
```

Take `cucumberReporter` from `@nils.hoyer/plainwright/config`, also with
[your own Playwright configuration](setup.md#with-your-own-playwright-configuration).
playwright-bdd's own finds none of the steps, because Plainwright reports each step at its line in
the feature file; it would mark every step as skipped. `defineConfig()` puts Plainwright's in its
place when you use playwright-bdd's. In your own configuration, list only Plainwright's: with
several Cucumber reports, the first one collects the results for all of them, so one of
playwright-bdd's before it marks the steps skipped in every report.

### Handing the report to CI

Each CI server reads the file from a setting of its own. Keep the report also when tests failed,
since that is when it matters.

**GitHub Actions** has no page for test results of its own; upload the files with the HTML
report, as in the [workflow above](#a-workflow-for-github-actions):

```yaml
- uses: actions/upload-artifact@v7
  if: ${{ !cancelled() }}
  with:
    name: reports
    path: |
      playwright-report/
      reports/
```

**GitLab CI** shows the test cases in the merge request:

```yaml
test:
  image: node:lts
  script:
    - npm ci
    - npx playwright install --with-deps chromium
    - npm test
  artifacts:
    when: always
    reports:
      junit: reports/junit.xml
```

**Azure DevOps** shows them in the Tests tab of the run:

```yaml
- script: npm test
- task: PublishTestResults@2
  condition: succeededOrFailed()
  inputs:
    testResultsFormat: JUnit
    testResultsFiles: reports/junit.xml
```

**Jenkins**, in a declarative pipeline:

```groovy
post {
  always {
    junit 'reports/junit.xml'
  }
}
```
