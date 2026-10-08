# Editor support

## What the Cucumber extension sees

The [Cucumber extension for VS Code](https://marketplace.visualstudio.com/items?itemName=CucumberOpen.cucumber-official)
(and other editors using the Cucumber language server) offers autocomplete, "go to step
definition" and warnings for undefined steps. It does not run your code. It reads step
definition files and looks for two shapes only:

- calls named `Given`, `When` or `Then` whose first argument is a literal string or regex, and
- `defineParameterType({ name: '…', regexp: /…/ })` calls.

So by default it does not know:

- steps defined with `defineStep({ pattern: … })`, including all built-in steps,
- keywords, which live in `.feature` files,
- steps in compiled packages under `node_modules`.

## Generated stubs

`playwright-keywords stubs` writes a file in exactly the shape the extension reads: one
`Given('pattern', () => {})` line per step (built-in, project steps and keywords) and the
`{element}` and `{number}` parameter types. The file is never executed.

```bash
npx playwright-keywords stubs --steps "steps/**/*.ts" --out .vscode/playwright-keywords.steps.js
```

```jsonc
// .vscode/settings.json
{
  "cucumber.features": ["features/**/*.feature"],
  "cucumber.glue": [".vscode/playwright-keywords.steps.js"],
}
```

- Keep the stub file **out of** playwright-bdd's `steps` glob, otherwise steps would be
  registered twice.
- Regenerate it after adding steps or keywords (for example in a `postinstall` or
  `pretest` script).
- "Go to definition" opens the stub, not the real definition. Use `catalog` or the location in
  `steps.json` to find the source.

Status: the stub format follows the extension's documented detection rules (tree-sitter queries
of `@cucumber/language-service`). It has not yet been tried in every editor; please report
problems.
