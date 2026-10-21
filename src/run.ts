import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { suggestSteps } from './registry';
import { renderStubs, STUBS_FILE } from './stubs';

export type RunOptions = {
  cwd?: string;
  /** Loads the project's own step files, for the editor's step list and for suggestions. */
  loadSteps?: () => Promise<void>;
};

/**
 * `plainwright test [playwright options]`: turns the feature files into Playwright tests
 * (playwright-bdd's `bddgen`), then runs them (`playwright test`). Options such as `--ui`,
 * `--headed` or a feature file go to Playwright; `--config` goes to both.
 */
export async function runTests(args: string[], options: RunOptions = {}): Promise<number> {
  const cwd = options.cwd ?? process.cwd();
  const require = createRequire(path.join(cwd, 'package.json'));
  let bddgen: string;
  let playwright: string;
  try {
    const bddPackage = require.resolve('playwright-bdd/package.json');
    bddgen = path.join(path.dirname(bddPackage), require(bddPackage).bin.bddgen);
    playwright = require.resolve('@playwright/test/cli');
  } catch {
    console.error(
      'plainwright test needs playwright-bdd and @playwright/test in this project:\n' +
        '  npm install --save-dev playwright-bdd @playwright/test',
    );
    return 1;
  }
  const loadSteps = once(options.loadSteps ?? (async () => {}));
  await refreshStubs(cwd, loadSteps);
  const generated = spawnSync(process.execPath, [bddgen, ...configArgs(args)], {
    cwd,
    stdio: ['inherit', 'inherit', 'pipe'],
    encoding: 'utf8',
  });
  if (generated.status !== 0) {
    const missing = missingSteps(generated.stderr ?? '');
    if (missing.length) {
      await loadSteps().catch(() => {});
      console.error(formatMissingSteps(missing));
    } else {
      process.stderr.write(generated.stderr ?? '');
    }
    return generated.status ?? 1;
  }
  process.stderr.write(generated.stderr ?? '');
  const run = spawnSync(process.execPath, [playwright, 'test', ...args], { cwd, stdio: 'inherit' });
  return run.status ?? 1;
}

/** `--config x`, `--config=x`, `-c x`: bddgen must read the same configuration. */
function configArgs(args: string[]): string[] {
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--config' || args[i] === '-c') return args.slice(i, i + 2);
    if (args[i].startsWith('--config=')) return [args[i]];
  }
  return [];
}

/**
 * Rewrites the editor's step list (written by `init` or `plainwright stubs`) when keywords or
 * steps changed, so new keywords show up in the editor after the next test run.
 */
async function refreshStubs(cwd: string, loadSteps: () => Promise<void>) {
  const file = path.join(cwd, STUBS_FILE);
  if (!fs.existsSync(file)) return;
  try {
    await loadSteps();
    const stubs = renderStubs();
    if (fs.readFileSync(file, 'utf8') !== stubs) fs.writeFileSync(file, stubs);
  } catch {
    // A step file that does not load fails the test run below, with its own error.
  }
}

export type MissingStep = { text: string; location: string };

/**
 * The steps bddgen found no definition for, from its error output. bddgen prints one code
 * snippet per missing step pattern, with the step and where it is:
 *
 *   Given('I press the {string} button', async ({}, arg) => {
 *     // Step: * I press the "Walk" button
 *     // From: features/todos.feature:13:5
 *   });
 */
export function missingSteps(output: string): MissingStep[] {
  if (!/^Missing step definitions: \d+/m.test(output)) return [];
  return [...output.matchAll(/\/\/ Step: \S+ (.*)\r?\n\s*\/\/ From: (.+?)(?::\d+)?\r?$/gm)].map(
    ([, text, location]) => ({ text, location }),
  );
}

/** The missing steps as lint reports them, with the closest existing step. */
export function formatMissingSteps(missing: MissingStep[]): string {
  const lines = missing.map(({ text, location }) => {
    const suggestion = suggestSteps(text)[0];
    return (
      `${location}: error: Unknown step "${text}".` +
      (suggestion ? ` Did you mean "${suggestion.example}"?` : '')
    );
  });
  return [
    ...lines,
    '',
    'No test ran: every step must exist first. ' +
      '"npx plainwright lint" lists every unknown step at once.',
  ].join('\n');
}

function once(fn: () => Promise<void>): () => Promise<void> {
  let result: Promise<void> | undefined;
  return () => (result ??= fn());
}
