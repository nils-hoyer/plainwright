import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';

/**
 * `plainwright test [playwright options]`: turns the feature files into Playwright tests
 * (playwright-bdd's `bddgen`), then runs them (`playwright test`). Options such as `--ui`,
 * `--headed` or a feature file go to Playwright; `--config` goes to both.
 */
export function runTests(args: string[], cwd = process.cwd()): number {
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
  const generated = spawnSync(process.execPath, [bddgen, ...configArgs(args)], {
    cwd,
    stdio: 'inherit',
  });
  if (generated.status !== 0) return generated.status ?? 1;
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
