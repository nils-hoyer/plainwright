# Contributing

Thanks for helping. Issues and pull requests are welcome.

## A change

1. Open an issue that describes the problem and the expected behaviour.
2. Install dependencies with `npm ci` and the browser with `npx playwright install chromium`.
3. Make your change in `src/` (built-in steps in `src/steps/`), with tests: unit tests in
   `test/unit/`, feature files in `test/features/` against the app in `test/test-app/`.
4. Run `npm run verify` (format, types, generated docs, feature lint, unit and end-to-end tests).
   It must pass; `npm run docs` updates the generated docs.
5. Open a pull request with the implementation and tests. Its title appears in the release
   notes, so describe the change for users. Don't change the version in `package.json`: the
   maintainer releases from GitHub Actions, which increases it.

## A new built-in step

1. Check that no step covers it, and that a [keyword](docs/keywords.md) cannot express it.
2. Word it with the [vocabulary rules](docs/vocabulary.md). Reuse existing verbs; do not add a
   synonym.
3. Define it with `defineStep()` in `src/steps/`, with a one-sentence `description` and an
   `example` that matches this step and no other. The unit tests check this.
4. A new **core** step needs an issue and an update to the
   [reviewer guide](docs/reading-tests.md), because a reviewer must understand every core step.
   Otherwise make it `level: 'advanced'`.

Step text is public API: renaming or removing a step is a breaking change, see
[versioning](docs/versioning.md).
