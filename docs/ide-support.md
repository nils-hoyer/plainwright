# Editor support

In VS Code, the [Cucumber extension](https://marketplace.visualstudio.com/items?itemName=CucumberOpen.cucumber-official)
suggests steps while you type in a feature file and marks steps that do not exist. This page is about VS Code; for IntelliJ IDEA, WebStorm, Neovim
and other editors, see [other editors](other-editors.md).

## In a project set up with init

`init` has set it up. Open the folder in VS Code and install the Cucumber extension when VS Code
suggests it. You get:

- suggestions for every step: built-in steps, your keywords and your steps in TypeScript;
- a warning on a step that does not exist;
- suggestions and checks in the files in `pages/` (see [pages](pages.md#suggestions-in-vs-code)).

After adding keywords or steps in TypeScript, the editor knows them after the next `npm test`,
which updates its step list. `npm run stubs` updates it without running the tests. Run it once
after cloning the project too: the file it writes, `.vscode/plainwright.steps.js`, is not
committed.

## Setting it up by hand

`plainwright stubs` writes the file the extension reads, and two settings point the extension
at it and at your feature files.

- Keep the stub file **out of** playwright-bdd's `steps` glob, otherwise steps would be
  registered twice.
- `plainwright test` updates `.vscode/plainwright.steps.js` when it exists. A stub file
  elsewhere needs `plainwright stubs` again after adding steps or keywords, for example in a
  `postinstall` or `pretest` script.

```bash
npx plainwright stubs --out .vscode/plainwright.steps.js
```

```jsonc
// .vscode/settings.json
{
  "cucumber.features": ["features/**/*.feature"],
  "cucumber.glue": [".vscode/plainwright.steps.js"],
}
```

## Why a stub file

The Cucumber extension does not run your code. It reads step definition files and looks for two
shapes only:

- calls named `Given`, `When` or `Then` whose first argument is a literal string or regex, and
- `defineParameterType({ name: '…', regexp: /…/ })` calls.

So on its own it does not know steps defined with `defineStep({ pattern: … })` (all built-in
steps), keywords, which live in `.feature` files, or steps in compiled packages under
`node_modules`. The stub file has one `Given('pattern', () => {})` line per step, built-in,
project steps and keywords, and the `{element}` and `{number}` parameter types. It is never
executed.

## Known limits

- "Go to definition" opens the stub, not the real definition. `npm run catalog` writes
  `steps.json` with the file and line of every project step and keyword.
- The stub format follows the extension's documented detection rules (the tree-sitter queries of
  `@cucumber/language-service`). It has not been tried in every editor yet; please
  [report problems](https://github.com/nils-hoyer/plainwright/issues).
