# Versioning policy

Feature files outlive code. Teams review and keep them for years, so the wording of steps is
treated like an API.

## What is public API

- The text of every built-in step, including parameter positions and types.
- The element type words (`button`, `field`, …) and how each finds elements.
- The JavaScript API exported from `plainwright` (`definePage`, `defineStep`,
  `defineKeywords`, `defineParameterType`, `test`, `World`, …).
- The command line (`lint`, `catalog`, `docs`, `inspect`, `stubs`), its options and the
  `file:line: severity: message (rule)` lint output.
- The structure of `steps.json` from `catalog`.

Messages of errors, descriptions and the generated docs are not API.

## Version numbers

The package follows [semantic versioning](https://semver.org/).

- **Before 1.0** (now): breaking changes only in minor releases (`0.1` → `0.2`). Patch releases
  never change step text.
- **From 1.0:** breaking changes only in major releases.

A breaking change is: renaming or removing a step, changing what a step does, changing how an
element type finds elements, or removing a public function or option.

## Renaming steps

A renamed step keeps its old wording for at least one minor release, marked `discouraged`, so
`lint` warns with the new wording. The changelog lists every rename under **Breaking** with a
search-and-replace hint.

## Changelog

Every release is listed in [CHANGELOG.md](../CHANGELOG.md), with breaking changes first.
