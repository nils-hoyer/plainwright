#!/usr/bin/env node
import fs from 'node:fs';
import { parseArgs } from 'node:util';
import { buildCatalog } from './catalog';
import { renderStepReference } from './docs';
import { formatInspectResult, inspectPage } from './inspect';
import { formatLintMessage, lintFeatures, summarize } from './lint';
import { loadStepFiles, resolveFiles } from './load';
import { getPageDefinitions, isUrlPattern } from './pages';
import { renderStubs } from './stubs';
// Registers the built-in steps.
import './index';

const HELP = `Usage: plainwright <command> [options]

Commands:
  lint      Check feature files: unknown or ambiguous steps, selectors, absolute URLs,
            fixed waits, advanced steps (info) and keyword definitions.
  catalog   Write all steps, element types, pages and data values as JSON for AI assistants.
  docs      Write all steps as a Markdown reference.
  inspect   Open a page and list its elements by type and visible name.
  stubs     Write a step file for editor autocomplete (Cucumber extension "cucumber.glue").

pages/, data/ and keywords/ in the project folder load by themselves.

Options:
  --steps <glob>       Your step files in TypeScript or JavaScript. Repeat for several
                       patterns. Default: the files in steps/, if there are any.
  --features <glob>    Feature files to lint (lint). Repeat for several patterns.
  --out <file>         Write to a file instead of the console (catalog, docs, stubs).
  --quiet              Hide info messages (lint).
  --base-url <url>     Base URL for relative addresses and page names (inspect).
  --storage-state <f>  Playwright storage state, e.g. a logged-in session (inspect).
  --json               Print JSON (inspect).
  --help               Show this help.

Examples:
  npx plainwright lint --features "features/**/*.feature"
  npx plainwright catalog --out steps.json
  npx plainwright inspect "Login" --base-url http://localhost:3000
`;

const DEFAULT_STEPS = ['steps/**/*.{ts,js,mjs,cjs}'];

async function main(argv: string[]): Promise<number> {
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
      help: { type: 'boolean', short: 'h' },
    },
  });
  const [command, ...rest] = positionals;
  if (values.help || !command) {
    console.log(HELP);
    return command || values.help ? 0 : 1;
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
      const messages = lintFeatures(files).filter((m) => !values.quiet || m.severity !== 'info');
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
      const page = getPageDefinitions().find((p) => p.name === target);
      if (page && (typeof page.url !== 'string' || isUrlPattern(page.url))) {
        console.error(`The page "${target}" has no address to open.`);
        return 1;
      }
      const result = await inspectPage(page ? (page.url as string) : target, {
        baseURL: values['base-url'],
        storageState: values['storage-state'],
      });
      console.log(values.json ? JSON.stringify(result, null, 2) : formatInspectResult(result));
      return 0;
    }
    default:
      console.error(`Unknown command "${command}".\n\n${HELP}`);
      return 1;
  }
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
