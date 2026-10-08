import path from 'node:path';
import { createJiti } from 'jiti';
import { globSync } from 'tinyglobby';

/** Resolves glob patterns to absolute file paths, sorted. */
export function resolveFiles(patterns: string[], cwd = process.cwd()): string[] {
  return globSync(patterns, { cwd, absolute: true, ignore: ['**/node_modules/**'] }).sort();
}

/**
 * Loads step, page and keyword files (TypeScript or JavaScript) so their definitions are
 * registered, the same way playwright-bdd loads them before running tests.
 */
export async function loadStepFiles(patterns: string[], cwd = process.cwd()): Promise<string[]> {
  const files = resolveFiles(patterns, cwd);
  if (!files.length) {
    throw new Error(`No step files match ${patterns.map((p) => `"${p}"`).join(', ')} in ${cwd}.`);
  }
  const jiti = createJiti(path.join(cwd, 'noop.js'), { interopDefault: true });
  for (const file of files) await jiti.import(file);
  return files;
}
