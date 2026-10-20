# Other editors

Editors find Plainwright's steps through a stub file: a plain JavaScript file with one
`Given('pattern', () => {})` line per step, which `plainwright stubs` writes (see
[why a stub file](ide-support.md#why-a-stub-file)). Any editor that reads Cucumber step
definitions can use it, so the setup is the same everywhere: write the stub file, then point the
editor at it. In a project set up with `init`, `npm run stubs` writes it to
`.vscode/plainwright.steps.js`; run it again after adding keywords or steps in TypeScript. VS Code
is described in [editor support](ide-support.md). The editors on this page have not been tried
yet; please [report problems](https://github.com/nils-hoyer/plainwright/issues).

```bash
npx plainwright stubs --out .vscode/plainwright.steps.js
```

## IntelliJ IDEA and WebStorm

WebStorm and IntelliJ IDEA Ultimate support feature files with two plugins, **Gherkin** and
**Cucumber.js**; enable both under Settings | Plugins. IntelliJ IDEA Community has no JavaScript
support, so it does not find the steps. The Cucumber.js plugin looks for `Given` calls in the
project's JavaScript files, which includes the stub file, so steps are suggested and steps that
don't exist are marked. When a step is missing, don't use the quick-fix "Create step
definition": it writes a Cucumber step definition, which Plainwright does not run. Use a
built-in step from the [step reference](steps.md) or write a [keyword](keywords.md) instead.

## Neovim

Neovim uses the Cucumber language server, the same one the VS Code extension uses. Install it
with npm and enable `cucumber_language_server` from
[nvim-lspconfig](https://github.com/neovim/nvim-lspconfig) with these settings, for example in
your `init.lua` (Neovim 0.11 and later):

```bash
npm install -g @cucumber/language-server
```

```lua
vim.lsp.config('cucumber_language_server', {
  settings = {
    cucumber = {
      features = { 'features/**/*.feature' },
      glue = { '.vscode/plainwright.steps.js' },
    },
  },
})
vim.lsp.enable('cucumber_language_server')
```

## Other editors with a language server client

Emacs, Sublime Text, Helix, Zed and other editors that can start a language server work like
Neovim: install `@cucumber/language-server`, start `cucumber-language-server --stdio` for
`.feature` files, and pass it these settings. How to do that is in your editor's documentation
for language servers.

```json
{
  "cucumber": {
    "features": ["features/**/*.feature"],
    "glue": [".vscode/plainwright.steps.js"]
  }
}
```
