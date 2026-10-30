#!/usr/bin/env node
import fs from 'node:fs';
import { parseArgs } from 'node:util';
import { buildCatalog } from './catalog';
import { renderStepReference } from './docs';
import { AiAssistant, init } from './init';
import { formatInspectResult, inspectPage } from './inspect';
import { formatLintMessage, lintFeatures, summarize } from './lint';
import { loadPlaywrightConfig, loadStepFiles, resolveFiles } from './load';
import { getPageDefinitions, isUrlPattern } from './pages';
import { runTests } from './run';
import { refreshStubs, renderStubs } from './stubs';
// Registers the built-in steps.
import './index';

const HELP = `Usage: plainwright <command> [options]

Commands:
  init      Set up this folder for tests: packages, Chromium, configuration, a first test.
  test      Run the tests (feature files): bddgen, then playwright test. Other options,
            such as --ui, --headed or a file, go to Playwright.
  lint      Check feature files: unknown, left-out or ambiguous steps, selectors, absolute
            URLs, fixed waits, advanced steps (info) and keyword definitions.
  catalog   Write all steps, element types, pages and data values as JSON for AI assistants.
  docs      Write all steps as a Markdown reference.
  inspect   Open a page and list its elements by type and visible name.
  stubs     Write a step file for editor autocomplete (Cucumber extension "cucumber.glue").

pages/, data/ and keywords/ in the project folder load by themselves.
plainwright <command> --help shows the options of one command.

Examples:
  npx @codesurfer/plainwright init
  npx plainwright test features/login.feature --headed
  npx plainwright lint --features "features/**/*.feature"
  npx plainwright catalog --out steps.json
  npx plainwright inspect "Login" --base-url http://localhost:3000
`;

const STEPS_OPTION = `  --steps <glob>       Your step files in TypeScript or JavaScript. Repeat for several
                       patterns. Default: the files in steps/, if there are any.`;

/** The help of each command, for plainwright <command> --help. */
const COMMAND_HELP: Record<string, string> = {
  init: `Usage: plainwright init [options]

Sets up this folder for tests: installs Plainwright, Playwright and Chromium, writes the
configuration, a first test against your app, AI instructions and editor settings, and adds
the npm scripts. It never overwrites a file. Without options, it asks for the address of your
app, the AI assistant, and whether to run the first test.

Options:
  --url <address>      The address of your app, instead of asking.
  --ai <assistant>     agents (AGENTS.md), copilot, claude or none, instead of asking.
  --yes, -y            Take the defaults for everything not given, and run the first test.
  --dry-run            Only list what would change.
  --no-install         Do not install packages and Chromium.
  --no-run             Do not run the first test.
`,
  lint: `Usage: plainwright lint [options]

Checks feature files without a browser: unknown or ambiguous steps, unknown pages and values,
selectors, absolute URLs, left-out steps, fixed waits, advanced steps (info) and keyword definitions. Prints
file:line: severity: message (rule), and exits with 1 when there is an error. Also updates
the editor's step list, .vscode/plainwright.steps.js, like plainwright test.

Options:
  --features <glob>    The feature files to check. Repeat for several patterns.
                       Default: every .feature file.
  --quiet              Hide info messages.
${STEPS_OPTION}
`,
  inspect: `Usage: plainwright inspect <page name or address> [options]

Opens the page in Chromium and lists its elements by type and visible name, as steps write
them, while your app is running.

Options:
  --base-url <url>     Where addresses start. Default: baseURL from playwright.config.
  --storage-state <f>  Open the page logged in, with a saved Playwright session.
  --json               Print JSON instead of a list.
${STEPS_OPTION}
`,
  catalog: `Usage: plainwright catalog [options]

Writes every step, the element types, your pages and data values as JSON, for AI assistants.

Options:
  --out <file>         Write to a file instead of the terminal.
${STEPS_OPTION}
`,
  docs: `Usage: plainwright docs [options]

Writes every step, your own steps and keywords included, as a Markdown reference.

Options:
  --out <file>         Write to a file instead of the terminal.
${STEPS_OPTION}
`,
  stubs: `Usage: plainwright stubs [options]

Writes a step file for the editor's suggestions (VS Code: "cucumber.glue").

Options:
  --out <file>         Write to a file instead of the terminal.
${STEPS_OPTION}
`,
};

const DEFAULT_STEPS = ['steps/**/*.{ts,js,mjs,cjs}'];

async function main(argv: string[]): Promise<number> {
  // Everything after "test" belongs to Playwright.
  if (argv[0] === 'test') return runTests(argv.slice(1));
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      steps: { type: 'string', multiple: true },
      features: { type: 'string', multiple: true },
      out: { type: 'string' },
      quiet: { type: 'boolean' },
      'base-url': { type: 'string' },
      'storage-state': { type: 'string' },
      json: { type: 'boolean' },
      url: { type: 'string' },
      ai: { type: 'string' },
      yes: { type: 'boolean', short: 'y' },
      'dry-run': { type: 'boolean' },
      'no-install': { type: 'boolean' },
      'no-run': { type: 'boolean' },
      help: { type: 'boolean', short: 'h' },
    },
  });
  const [command, ...rest] = positionals;
  if (values.help || !command) {
    console.log(COMMAND_HELP[command] ?? HELP);
    return command || values.help ? 0 : 1;
  }

  if (command === 'init') {
    const ai = values.ai as AiAssistant | undefined;
    if (ai && !['agents', 'copilot', 'claude', 'none'].includes(ai)) {
      console.error(`Unknown --ai "${ai}". Use agents, copilot, claude or none.`);
      return 1;
    }
    return init({
      url: values.url,
      ai,
      yes: values.yes,
      dryRun: values['dry-run'],
      install: !values['no-install'],
      run: values['no-run'] ? false : values.yes ? true : undefined,
    });
  }

  const stepFiles = values.steps ?? (resolveFiles(DEFAULT_STEPS).length ? DEFAULT_STEPS : []);
  if (stepFiles.length) await loadStepFiles(stepFiles);

  switch (command) {
    case 'lint': {
      const files = resolveFiles(values.features ?? ['**/*.feature']);
      if (!files.length) {
        console.error('No feature files found. Pass --features "<glob>".');
        return 1;
      }
      // The configuration may set environment variables, such as defaults for {env.NAME}.
      await loadPlaywrightConfig();
      const messages = lintFeatures(files).filter((m) => !values.quiet || m.severity !== 'info');
      refreshStubs(process.cwd());
      for (const message of messages) console.log(formatLintMessage(message));
      console.log(`${files.length} feature file(s): ${summarize(messages)}`);
      return messages.some((m) => m.severity === 'error') ? 1 : 0;
    }
    case 'catalog':
      return write(values.out, `${JSON.stringify(buildCatalog(), null, 2)}\n`);
    case 'docs':
      return write(values.out, `# Steps\n\n${renderStepReference(undefined, 2)}\n`);
    case 'stubs':
      return write(values.out, renderStubs());
    case 'inspect': {
      const target = rest[0];
      if (!target) {
        console.error('Usage: plainwright inspect <url or page name>');
        return 1;
      }
      const pages = getPageDefinitions();
      const page = pages.find((p) => p.name === target);
      if (page && (typeof page.url !== 'string' || isUrlPattern(page.url))) {
        console.error(`The page "${target}" has no address to open.`);
        return 1;
      }
      if (!page && !isAddress(target)) {
        const known = pages.map((p) => `"${p.name}"`).join(', ');
        console.error(
          `No page named "${target}".` +
            (known ? ` Pages: ${known}.` : ' There are no pages in pages/.') +
            ` For an address, start it with /: plainwright inspect "/${target}"`,
        );
        return 1;
      }
      const result = await inspectPage(page ? (page.url as string) : target, {
        baseURL: values['base-url'] ?? (await configuredBaseURL()),
        storageState: values['storage-state'],
        aliases: page?.elements,
      });
      console.log(values.json ? JSON.stringify(result, null, 2) : formatInspectResult(result));
      return 0;
    }
    default:
      console.error(`Unknown command "${command}".\n\n${HELP}`);
      return 1;
  }
}

/** `/login`, `?tab=2`, `https://…`: an address, not a page name. */
function isAddress(target: string) {
  return /^[/.?#]/.test(target) || /^[a-z][a-z0-9+.-]*:\/\//i.test(target);
}

/** `use.baseURL` from playwright.config.*, so inspect needs no --base-url. */
async function configuredBaseURL(): Promise<string | undefined> {
  const config = (await loadPlaywrightConfig())?.config;
  return config?.use?.baseURL ?? config?.projects?.find((p) => p.use?.baseURL)?.use?.baseURL;
}

function write(file: string | undefined, content: string): number {
  if (file) {
    fs.writeFileSync(file, content);
    console.log(`Wrote ${file}`);
  } else {
    process.stdout.write(content);
  }
  return 0;
}

main(process.argv.slice(2)).then(
  (code) => {
    process.exitCode = code;
  },
  (error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  },
);
