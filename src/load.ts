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

/**
 * Feature and step file patterns of one playwright-bdd project, relative to `cwd`, and the
 * folder bddgen writes the tests to.
 */
export type BddFiles = { cwd: string; features: string[]; steps: string[]; outputDir?: string };

/**
 * Loads playwright.config.* (or `file`) and returns it with the feature and step patterns of
 * every playwright-bdd project in it, without the built-in steps. Undefined when there is no
 * configuration or it does not load.
 */
export async function loadPlaywrightConfig(
  cwd = process.cwd(),
  file?: string,
): Promise<{ config: PlaywrightConfigShape; bdd: BddFiles[] } | undefined> {
  const configFile = file
    ? path.resolve(cwd, file)
    : resolveFiles(['playwright.config.{ts,js,mjs,cjs,mts,cts}'], cwd)[0];
  if (!configFile) return undefined;
  // defineBddConfig() stores the resolved projects in this variable. Keep it out of the
  // environment that bddgen and Playwright inherit from this process.
  const before = process.env.PLAYWRIGHT_BDD_CONFIGS;
  delete process.env.PLAYWRIGHT_BDD_CONFIGS;
  try {
    const jiti = createJiti(path.join(cwd, 'noop.js'), { interopDefault: true });
    const config = (await jiti.import(configFile, { default: true })) as PlaywrightConfigShape;
    const projects = JSON.parse(process.env.PLAYWRIGHT_BDD_CONFIGS ?? '{}') as Record<
      string,
      { configDir: string; features?: string | string[]; steps?: string | string[] }
    >;
    const bdd = Object.entries(projects).map(([outputDir, { configDir, features, steps }]) => ({
      cwd: configDir,
      outputDir,
      features: [features ?? []].flat(),
      steps: [steps ?? []]
        .flat()
        .filter((pattern) => !isBuiltInSteps(path.resolve(configDir, pattern))),
    }));
    return { config, bdd };
  } catch {
    return undefined;
  } finally {
    if (before === undefined) delete process.env.PLAYWRIGHT_BDD_CONFIGS;
    else process.env.PLAYWRIGHT_BDD_CONFIGS = before;
  }
}

type PlaywrightConfigShape = {
  use?: { baseURL?: string };
  projects?: { use?: { baseURL?: string } }[];
};

/** The file that registers the built-in steps (`steps` from the package), as .js or .ts. */
function isBuiltInSteps(file: string) {
  return file.replace(/\.[cm]?[jt]s$/, '') === path.join(__dirname, 'index');
}
