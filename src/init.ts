import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { createInterface } from 'node:readline/promises';
import { globSync } from 'tinyglobby';
import { inspectPage } from './inspect';
import { appPagesFile } from './pages';
import { renderStubs } from './stubs';

export type AiAssistant = 'agents' | 'copilot' | 'claude' | 'none';

export type InitOptions = {
  cwd?: string;
  /** The address of the app; asked for when missing. */
  url?: string;
  /** Instructions for which AI assistant; asked for when missing. */
  ai?: AiAssistant;
  /** Take the defaults instead of asking. */
  yes?: boolean;
  /** Only list what would change. */
  dryRun?: boolean;
  /** Install the packages and Chromium (default). */
  install?: boolean;
  /** Run the first test at the end (default: ask). */
  run?: boolean;
  log?: (line: string) => void;
};

type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun';

const COMMANDS: Record<PackageManager, { add: string[]; exec: string[]; run: string }> = {
  npm: { add: ['install', '--save-dev'], exec: ['npx'], run: 'npm run' },
  pnpm: { add: ['add', '--save-dev'], exec: ['pnpm', 'exec'], run: 'pnpm run' },
  yarn: { add: ['add', '--dev'], exec: ['yarn'], run: 'yarn run' },
  bun: { add: ['add', '--dev'], exec: ['bunx'], run: 'bun run' },
};

const AI_FILES: Record<Exclude<AiAssistant, 'none'>, { template: string; file: string }> = {
  agents: { template: 'AGENTS.md', file: 'AGENTS.md' },
  copilot: { template: 'copilot-instructions.md', file: '.github/copilot-instructions.md' },
  claude: { template: 'claude-skill/SKILL.md', file: '.claude/skills/plainwright/SKILL.md' },
};

const AI_CHOICES: { value: AiAssistant; label: string }[] = [
  { value: 'agents', label: 'AGENTS.md (GitHub Copilot, Codex, Cursor and most others read it)' },
  { value: 'copilot', label: 'GitHub Copilot only (.github/copilot-instructions.md)' },
  { value: 'claude', label: 'Claude Code (a skill in .claude/skills/)' },
  { value: 'none', label: 'none' },
];

const GITIGNORE = [
  'node_modules/',
  '.features-gen/',
  'playwright-report/',
  'test-results/',
  'playwright/.auth/',
  '.env',
  'steps.json',
  '.vscode/plainwright.steps.js',
];

/** What npm writes into a new package.json; replacing it overwrites nothing of value. */
const NPM_DEFAULT_TEST = 'echo "Error: no test specified" && exit 1';

/**
 * Sets up a project for Plainwright tests: packages, Chromium, configuration, a first test
 * against the app, AI instructions, editor support and npm scripts. Files that exist are never
 * overwritten; running it again adds only what is missing.
 */
export async function init(options: InitOptions = {}): Promise<number> {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const log = options.log ?? ((line: string) => console.log(line));
  const ask = createAsker(options, log);
  const pm = detectPackageManager(cwd);
  const configFound = globSync('playwright.config.{ts,js,mjs,cjs,mts,cts}', { cwd })[0];
  // A config that already runs feature files needs nothing; another one needs a few lines.
  const runsFeatures =
    configFound &&
    /@codesurfer\/plainwright|defineBddConfig/.test(
      fs.readFileSync(path.join(cwd, configFound), 'utf8'),
    );
  const existingConfig = runsFeatures ? undefined : configFound;
  const pkgFile = path.join(cwd, 'package.json');
  const pkg: Record<string, unknown> = fs.existsSync(pkgFile)
    ? JSON.parse(fs.readFileSync(pkgFile, 'utf8'))
    : { name: packageName(cwd), private: true };

  log(
    fs.existsSync(pkgFile)
      ? `Adding Plainwright to ${pkg.name ?? 'this project'} (${pm}).`
      : `Setting up a new test project in ${cwd}.`,
  );

  // 1. Questions, each with a default.
  const address = normalizeUrl(
    options.url ?? (await ask('What is the address of your app?', 'http://localhost:3000')),
  );
  const { baseURL, startPath } = splitAddress(address);
  const reachable = await answers(address);
  log(
    reachable
      ? `  ${address} answers.`
      : `  ${address} does not answer right now. Start your app before you run the tests.`,
  );
  const ai = options.ai ?? (await chooseAssistant(ask));

  // 2. Files, never overwriting one that exists.
  const changes = new Changes(cwd, log, options.dryRun ?? false);
  if (configFound) {
    changes.skip(
      configFound,
      runsFeatures ? 'exists' : 'exists; add Plainwright to it as shown below',
    );
  } else {
    changes.create('playwright.config.ts', configFile(baseURL));
  }
  // In Next.js, Nuxt and the like, pages/ belongs to the app, and Plainwright loads no pages
  // from it. The first test then opens the address.
  const appPages = appPagesFile(cwd);
  if (appPages) {
    changes.skip('pages/start.json', `pages/ holds your app's files (${appPages})`);
  } else {
    changes.create(
      'pages/start.json',
      `${JSON.stringify({ name: 'Start', url: startPath }, null, 2)}\n`,
    );
  }
  changes.create('keywords/example.feature', KEYWORD_EXAMPLE);
  if (ai !== 'none') changes.create(AI_FILES[ai].file, aiInstructions(ai));
  changes.create(
    '.vscode/extensions.json',
    `${JSON.stringify({ recommendations: ['CucumberOpen.cucumber-official'] }, null, 2)}\n`,
  );
  changes.create('.vscode/settings.json', VSCODE_SETTINGS);
  changes.appendLines('.gitignore', GITIGNORE);
  const scripts = scriptsFor(baseURL);
  changes.packageJson(pkgFile, pkg, scripts);

  // 3. Packages and Chromium.
  const install = options.install !== false && !options.dryRun;
  const packages = missingPackages(pkg);
  if (packages.length) {
    if (install) {
      log(`Installing ${packages.join(', ')} …`);
      if (!runCommand([pm, ...COMMANDS[pm].add, ...packages], cwd)) return 1;
    } else {
      log(`  would install ${packages.join(', ')}`);
    }
  }
  if (install) {
    log('Installing Chromium …');
    if (!runCommand([...COMMANDS[pm].exec, 'playwright', 'install', 'chromium'], cwd)) return 1;
  }

  // 4. A first test against the app itself, from what its start page shows.
  if (globSync('features/**/*.feature', { cwd }).length) {
    changes.skip('features/', 'has tests already');
  } else {
    const check = reachable ? await firstCheck(baseURL, startPath) : undefined;
    changes.create('features/example.feature', exampleFeature(!appPages, startPath, check));
  }
  if (!options.dryRun) changes.create('.vscode/plainwright.steps.js', renderStubs());

  if (options.dryRun) {
    log('\nNothing was changed (--dry-run).');
    return 0;
  }
  if (existingConfig) log(`\n${existingConfigHelp(existingConfig, baseURL)}`);
  if (
    fs.existsSync(path.join(cwd, '.vscode/settings.json')) &&
    changes.skipped('.vscode/settings.json')
  ) {
    log(`\nFor suggestions in VS Code, add to .vscode/settings.json:\n${VSCODE_SETTINGS}`);
  }

  // 5. Run it.
  let passed: boolean | undefined;
  const runNow = install && (options.run ?? (await confirm(ask, 'Run the first test now?')));
  if (runNow && !existingConfig) {
    log('');
    // Without a terminal on stdin, Playwright neither opens the report nor prints its own
    // command for it; the next steps below name the project's report script.
    passed = runCommand([...COMMANDS[pm].run.split(' '), 'test'], cwd, 'ignore');
  }

  // 6. What next.
  const testScript = (pkg.scripts as Record<string, string> | undefined)?.test;
  const ownTest = !testScript || testScript === NPM_DEFAULT_TEST || testScript === scripts.test;
  const run = (script: string) =>
    script === 'test' && !ownTest
      ? `${COMMANDS[pm].exec.join(' ')} plainwright test`
      : script === 'test' && pm === 'npm'
        ? 'npm test'
        : `${COMMANDS[pm].run} ${script}`;
  log('');
  if (passed === false && reachable) log('The first test failed; the report shows why.');
  if (passed === false && !reachable)
    log(`The first test failed: start your app at ${address} first.`);
  log('Next:');
  log(`  1. Change features/example.feature, or add more .feature files in features/.`);
  log(`  2. ${run('test')} runs the tests, ${run('report')} shows the report.`);
  log(`  3. ${run('inspect')} -- "/" lists the buttons, fields and links of a page.`);
  log('More: https://github.com/nils-hoyer/plainwright#readme');
  return passed === false ? 1 : 0;
}

/** Records and prints each change; in a dry run, only prints it. */
class Changes {
  #skipped = new Set<string>();

  constructor(
    readonly cwd: string,
    readonly log: (line: string) => void,
    readonly dryRun: boolean,
  ) {}

  create(file: string, content: string) {
    const target = path.join(this.cwd, file);
    if (fs.existsSync(target)) return this.skip(file, 'exists');
    this.log(`  ${this.dryRun ? 'would create' : 'created'} ${file}`);
    if (this.dryRun) return;
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content);
  }

  appendLines(file: string, lines: string[]) {
    const target = path.join(this.cwd, file);
    const current = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : '';
    const present = new Set(current.split(/\r?\n/).map((line) => line.trim()));
    const missing = lines.filter(
      (line) => !present.has(line) && !present.has(line.replace(/\/$/, '')),
    );
    if (!missing.length) return this.skip(file, 'has every entry');
    this.log(`  ${this.dryRun ? 'would add' : 'added'} ${missing.join(', ')} to ${file}`);
    if (this.dryRun) return;
    const separator = current && !current.endsWith('\n') ? '\n' : '';
    fs.writeFileSync(target, `${current}${separator}${missing.join('\n')}\n`);
  }

  packageJson(file: string, pkg: Record<string, unknown>, scripts: Record<string, string>) {
    const current = (pkg.scripts ?? {}) as Record<string, string>;
    const added: string[] = [];
    for (const [name, command] of Object.entries(scripts)) {
      if (current[name] && !(name === 'test' && current[name] === NPM_DEFAULT_TEST)) {
        if (current[name] !== command) this.skip(`script "${name}"`, `exists: ${current[name]}`);
        continue;
      }
      current[name] = command;
      added.push(name);
    }
    const created = !fs.existsSync(file);
    if (!added.length && !created) return;
    const what = created ? 'package.json with the scripts' : 'the scripts';
    this.log(`  ${this.dryRun ? 'would add' : 'added'} ${what} ${added.join(', ')}`);
    if (this.dryRun) return;
    pkg.scripts = current;
    fs.writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`);
  }

  skip(what: string, why: string) {
    this.#skipped.add(what);
    this.log(`  skipped ${what}: ${why}`);
  }

  skipped(what: string) {
    return this.#skipped.has(what);
  }
}

function scriptsFor(baseURL: string): Record<string, string> {
  return {
    test: 'plainwright test',
    report: 'playwright show-report',
    lint: "plainwright lint --features 'features/**/*.feature' --quiet",
    inspect: 'plainwright inspect',
  };
}

function configFile(baseURL: string) {
  return `import { defineConfig } from '@codesurfer/plainwright/config';

// Tests are in features/, your own sentences in keywords/, named pages in pages/.
// More options: https://github.com/nils-hoyer/plainwright/blob/main/docs/setup.md
export default defineConfig({
  // The address of your app. "/login" in a test means ${baseURL}/login
  baseURL: '${baseURL}',
});
`;
}

/** The lines docs/setup.md shows for a configuration of one's own. */
function existingConfigHelp(file: string, baseURL: string) {
  return `${file} exists, so it was left as it is. To run feature files with it, add:

  import { defineBddConfig } from 'playwright-bdd';
  import { aiFixPromptTemplate, steps } from '@codesurfer/plainwright';

  const testDir = defineBddConfig({
    features: 'features/**/*.feature',
    // Your own steps, if any, and Plainwright's ready-made steps.
    steps: ['steps/**/*.ts', steps],
    // Failed tests get a "Fix with AI" prompt in the report.
    aiFix: { promptAttachment: true, promptTemplate: aiFixPromptTemplate },
  });

and in its defineConfig():

  testDir,
  use: { baseURL: '${baseURL}', actionTimeout: 10_000, trace: 'retain-on-failure' },

Then run the tests with npx plainwright test. See
https://github.com/nils-hoyer/plainwright/blob/main/docs/setup.md#with-your-own-playwright-configuration`;
}

const KEYWORD_EXAMPLE = `# Your own sentences, made of existing steps. Every file in keywords/ loads by itself.
# Remove the # signs below to try it; then any test can write: * I search for "coffee"
#
# Feature: Search
#
#   Scenario Outline: I search for "<text>"
#     Types the text into the search field and starts the search.
#
#     * I fill "<text>" in the "Search" field
#     * I press "Enter" in the "Search" field
#
#     Examples:
#       | text   |
#       | coffee |
`;

const VSCODE_SETTINGS = `{
  // Suggestions for steps (Cucumber extension) and for the files in pages/.
  "cucumber.features": ["features/**/*.feature", "keywords/**/*.feature"],
  "cucumber.glue": [".vscode/plainwright.steps.js"],
  "json.schemas": [
    {
      "fileMatch": ["**/pages/**/*.json"],
      "url": "./node_modules/@codesurfer/plainwright/schema/page.json"
    }
  ]
}
`;

/** The check of the first test: the first heading, button or link the start page shows. */
async function firstCheck(baseURL: string, startPath: string): Promise<string | undefined> {
  try {
    const { elements } = await inspectPage(startPath, { baseURL });
    for (const type of ['heading', 'button', 'link'] as const) {
      const name = elements[type]?.find((n) => n.length <= 60 && !n.includes('\n'));
      if (name) return `I see the "${name.replace(/(["\\])/g, '\\$1')}" ${type}`;
    }
  } catch {
    // No browser or no page: the test checks the address instead.
  }
  return undefined;
}

/** The first test: opens the start page by name, or by its address without pages/start.json. */
function exampleFeature(named: boolean, startPath: string, check?: string) {
  const address = startPath.replace(/(["\\])/g, '\\$1');
  const open = named ? 'I open the "Start" page' : `I open the url "${address}"`;
  check ??= `I see the url "${address}"`;
  return `Feature: Start page

  The first test, written by plainwright init. Change it, or add more .feature files here.

  Scenario: The start page opens
    * ${open}
    * ${check}
`;
}

function aiInstructions(ai: Exclude<AiAssistant, 'none'>) {
  const file = path.join(__dirname, '..', 'templates', AI_FILES[ai].template);
  // The templates say where to copy them; the copy does not need that line.
  return fs.readFileSync(file, 'utf8').replace(/^<!-- Generated from templates[^\n]*-->\n\n?/m, '');
}

function missingPackages(pkg: Record<string, unknown>): string[] {
  const have = {
    ...(pkg.dependencies as object | undefined),
    ...(pkg.devDependencies as object | undefined),
  };
  const own = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
  return [
    [own.name as string, `${own.name}@^${own.version}`],
    ['playwright-bdd', 'playwright-bdd@^9'],
    ['@playwright/test', '@playwright/test'],
  ]
    .filter(([name]) => !Object.hasOwn(have, name))
    .map(([, spec]) => spec);
}

export function detectPackageManager(cwd: string): PackageManager {
  if (fs.existsSync(path.join(cwd, 'pnpm-lock.yaml'))) return 'pnpm';
  if (fs.existsSync(path.join(cwd, 'yarn.lock'))) return 'yarn';
  if (['bun.lock', 'bun.lockb'].some((f) => fs.existsSync(path.join(cwd, f)))) return 'bun';
  if (fs.existsSync(path.join(cwd, 'package-lock.json'))) return 'npm';
  // Started with pnpm dlx, yarn dlx or bunx in a new folder.
  const agent = process.env.npm_config_user_agent ?? '';
  for (const pm of ['pnpm', 'yarn', 'bun'] as const) if (agent.startsWith(pm)) return pm;
  return 'npm';
}

/** `localhost:3000` → `http://localhost:3000`. */
export function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
}

/** `http://localhost:3000/app/start` → base URL `http://localhost:3000`, start page `/app/start`. */
export function splitAddress(address: string): { baseURL: string; startPath: string } {
  const url = new URL(address);
  return { baseURL: url.origin, startPath: `${url.pathname}${url.search}` || '/' };
}

async function answers(url: string): Promise<boolean> {
  try {
    await fetch(url, { signal: AbortSignal.timeout(3000) });
    return true;
  } catch {
    return false;
  }
}

function packageName(cwd: string) {
  return (
    path
      .basename(cwd)
      .toLowerCase()
      .replace(/[^a-z0-9._~-]+/g, '-')
      .replace(/^[._-]+/, '') || 'browser-tests'
  );
}

function runCommand(
  [command, ...args]: string[],
  cwd: string,
  stdin: 'inherit' | 'ignore' = 'inherit',
): boolean {
  const result = spawnSync(command, args, {
    cwd,
    stdio: [stdin, 'inherit', 'inherit'],
    shell: process.platform === 'win32',
  });
  return result.status === 0;
}

export type Ask = (question: string, fallback: string) => Promise<string>;

function createAsker(options: InitOptions, log: (line: string) => void): Ask {
  const interactive = !options.yes && process.stdin.isTTY;
  if (!options.yes && !process.stdin.isTTY) {
    log('Not started from a terminal: using the defaults (pass --url and --ai to choose).');
  }
  return async (question, fallback) => {
    if (!interactive) return fallback;
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    try {
      return (await rl.question(`${question} (${fallback}) `)).trim() || fallback;
    } finally {
      rl.close();
    }
  };
}

/** Asks which assistant gets instructions until the answer is a number or a name from --ai. */
export async function chooseAssistant(ask: Ask): Promise<AiAssistant> {
  const list = AI_CHOICES.map((choice, i) => `  ${i + 1}. ${choice.label}`).join('\n');
  let question = `Which AI assistant should get instructions?\n${list}\nNumber`;
  for (;;) {
    const answer = (await ask(question, '1')).trim().toLowerCase();
    const choice = /^\d+$/.test(answer)
      ? AI_CHOICES[Number(answer) - 1]
      : AI_CHOICES.find(({ value }) => value === answer);
    if (choice) return choice.value;
    question = `"${answer}" is not one of them. Write a number from 1 to ${AI_CHOICES.length}, or ${AI_CHOICES.map(({ value }) => value).join(', ')}`;
  }
}

async function confirm(ask: Ask, question: string): Promise<boolean> {
  return /^y/i.test(await ask(`${question} [Y/n]`, 'y'));
}
