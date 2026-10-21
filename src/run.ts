import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { readableSyntaxError } from './gherkin';
import { validateKeywords } from './keywords';
import { formatLintMessage, lintFeatures } from './lint';
import { BddFiles, loadPlaywrightConfig, loadStepFiles, resolveFiles } from './load';
import { mapToFeatures } from './locations';
import { renderStubs, STUBS_FILE } from './stubs';

/** Without a configuration that loads: the defaults of defineConfig(). */
const DEFAULT_FILES: Omit<BddFiles, 'cwd'> = {
  features: ['features/**/*.feature'],
  steps: ['steps/**/*.{ts,js}'],
};

/**
 * `plainwright test [playwright options]`: turns the feature files into Playwright tests
 * (playwright-bdd's `bddgen`), then runs them (`playwright test`). Options such as `--ui`,
 * `--headed` or a feature file go to Playwright; `--config` goes to both.
 */
export async function runTests(args: string[], cwd = process.cwd()): Promise<number> {
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
  if (args.includes('--help') || args.includes('-h')) {
    console.log(
      'Usage: plainwright test [options]\n\n' +
        "Turns the feature files into Playwright tests (playwright-bdd's bddgen) and runs them\n" +
        '(playwright test). Every option goes to Playwright; these are its options:\n',
    );
    return (
      spawnSync(process.execPath, [playwright, 'test', '--help'], { cwd, stdio: 'inherit' })
        .status ?? 1
    );
  }
  const config = configArgs(args);
  const configFile = config.length === 2 ? config[1] : config[0]?.slice('--config='.length);
  const projects = (await loadPlaywrightConfig(cwd, configFile))?.bdd ?? [
    { cwd, ...DEFAULT_FILES },
  ];
  // The project's own steps, as bddgen loads them, for keywords, lint and the editor.
  const loaded = await loadSteps(projects);
  if (loaded) {
    const errors = validateKeywords();
    if (errors.length) {
      console.error(`Invalid keywords:\n${errors.join('\n')}\n\nNo test ran.`);
      return 1;
    }
    refreshStubs(cwd);
  }

  const generated = spawnSync(process.execPath, [bddgen, ...config], {
    cwd,
    stdio: ['inherit', 'inherit', 'pipe'],
    encoding: 'utf8',
  });
  const output = readableParseErrors(generated.stderr ?? '');
  if (generated.status !== 0 && MISSING_STEPS.test(output)) {
    const unknown = loaded ? unknownSteps(projects) : [];
    if (unknown.length) {
      process.stderr.write(withoutSnippets(output));
      console.error(
        `${unknown.join('\n')}\n\nNo test ran: every step must exist first. ` +
          '"npx plainwright lint" also lists them.',
      );
      return generated.status ?? 1;
    }
  }
  process.stderr.write(output);
  if (generated.status !== 0) return generated.status ?? 1;
  for (const { outputDir, cwd: configDir } of projects) {
    try {
      if (outputDir) mapToFeatures(outputDir, configDir);
    } catch {
      // Locations then stay in the generated files.
    }
  }
  const run = spawnSync(process.execPath, [playwright, 'test', ...args], { cwd, stdio: 'inherit' });
  return run.status ?? 1;
}

const MISSING_STEPS = /^Missing step definitions: \d+/m;

/**
 * bddgen's output without its list of missing steps, a TypeScript snippet for each written for
 * programmers. Other errors in the output stay.
 */
export function withoutSnippets(output: string): string {
  return output.replace(
    /^Missing step definitions: \d+[\s\S]*?Use snippets above to create missing steps\.\r?\n?/gm,
    '',
  );
}

/**
 * bddgen's syntax errors in words, like lint's:
 * `Error: Parse error in "features/a.feature" (5:3): expected: …` → `features/a.feature:5:3: …`.
 */
export function readableParseErrors(output: string): string {
  return output.replace(
    /^Error: Parse error in "(.+?)" \((\d+):(\d+)\): (.*)$/gm,
    (_, file: string, line: string, column: string, message: string) =>
      `${file}:${line}:${column}: ${readableSyntaxError(message).text}`,
  );
}

/** `--config x`, `--config=x`, `-c x`: bddgen must read the same configuration. */
function configArgs(args: string[]): string[] {
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--config' || args[i] === '-c') return args.slice(i, i + 2);
    if (args[i].startsWith('--config=')) return [args[i]];
  }
  return [];
}

/** Loads the step files of every project. False when one does not load outside the runner. */
async function loadSteps(projects: BddFiles[]): Promise<boolean> {
  try {
    for (const { cwd, steps } of projects) {
      if (resolveFiles(steps, cwd).length) await loadStepFiles(steps, cwd);
    }
    return true;
  } catch (error) {
    console.warn(
      `[plainwright] Your step files do not load outside the test run, so keywords are checked ` +
        `and the editor's step list is updated only by the tests: ${(error as Error).message}`,
    );
    return false;
  }
}

/**
 * Rewrites the editor's step list (written by `init` or `plainwright stubs`) when keywords or
 * steps changed, so new keywords show up in the editor after the next test run.
 */
function refreshStubs(cwd: string) {
  const file = path.join(cwd, STUBS_FILE);
  if (!fs.existsSync(file)) return;
  const stubs = renderStubs();
  if (fs.readFileSync(file, 'utf8') !== stubs) fs.writeFileSync(file, stubs);
}

/** Lint's messages for steps that do not exist or match several steps, in every feature file. */
function unknownSteps(projects: BddFiles[]): string[] {
  const files = [...new Set(projects.flatMap(({ cwd, features }) => resolveFiles(features, cwd)))];
  return lintFeatures(files)
    .filter((m) => m.rule === 'undefined-step' || m.rule === 'ambiguous-step')
    .map(formatLintMessage);
}
