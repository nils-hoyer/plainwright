import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { refreshStubs, renderStubs, STUBS_FILE } from '../../src/stubs';
import {
  chooseAssistant,
  detectPackageManager,
  init,
  normalizeUrl,
  splitAddress,
} from '../../src/init';
// Registers the built-in steps for the editor stubs that init writes.
import '../../src/index';

/** An empty folder, or one with these files. */
function folder(files: Record<string, string> = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'plainwright-init-'));
  for (const [file, content] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    fs.writeFileSync(path.join(dir, file), content);
  }
  return dir;
}

/** init without installing, running or a reachable app (port 9 does not answer). */
async function run(cwd: string, options: Parameters<typeof init>[0] = {}) {
  const lines: string[] = [];
  const code = await init({
    cwd,
    yes: true,
    url: 'localhost:9/start',
    ai: 'agents',
    install: false,
    run: false,
    log: (line) => lines.push(line),
    ...options,
  });
  return { code, output: lines.join('\n') };
}

const read = (dir: string, file: string) => fs.readFileSync(path.join(dir, file), 'utf8');

describe('init in an empty folder', () => {
  it('writes a project that runs feature files', async () => {
    const dir = folder();
    const { code } = await run(dir);
    expect(code).toBe(0);
    expect(fs.readdirSync(dir, { recursive: true }).map(String).sort()).toEqual([
      '.gitignore',
      '.vscode',
      '.vscode/extensions.json',
      '.vscode/plainwright.steps.js',
      '.vscode/settings.json',
      'AGENTS.md',
      'features',
      'features/example.feature',
      'keywords',
      'keywords/example.feature',
      'package.json',
      'pages',
      'pages/start.json',
      'playwright.config.ts',
    ]);
    expect(read(dir, 'playwright.config.ts')).toContain("baseURL: 'http://localhost:9',");
    expect(JSON.parse(read(dir, 'pages/start.json'))).toEqual({ name: 'Start', url: '/start' });
    const pkg = JSON.parse(read(dir, 'package.json'));
    expect(pkg.private).toBe(true);
    expect(pkg.scripts.test).toBe('plainwright test');
    // catalog is for AI assistants, which call npx; test and lint update the editor's step list.
    expect(Object.keys(pkg.scripts)).toEqual(['test', 'report', 'lint', 'inspect']);
    // Without the app, the first test checks the address.
    expect(read(dir, 'features/example.feature')).toContain('* I see the url "/start"');
    expect(read(dir, 'AGENTS.md')).toMatch(/^# Writing browser tests with Plainwright/);
  });

  it('adds only what is missing when it runs again', async () => {
    const dir = folder();
    await run(dir);
    const before = read(dir, 'features/example.feature');
    const { output } = await run(dir, { ai: 'claude' });
    expect(output).toContain('skipped playwright.config.ts: exists\n');
    expect(output).toContain('skipped .gitignore: has every entry');
    expect(output).toContain('created .claude/skills/plainwright/SKILL.md');
    expect(output).not.toContain('add Plainwright to it');
    expect(read(dir, 'features/example.feature')).toBe(before);
  });

  it('changes nothing with dryRun', async () => {
    const dir = folder();
    const { output } = await run(dir, { dryRun: true });
    expect(output).toContain('would create playwright.config.ts');
    expect(fs.readdirSync(dir)).toEqual([]);
  });
});

describe('init in an existing project', () => {
  const files = {
    'package.json': JSON.stringify({ name: 'shop', scripts: { test: 'playwright test' } }),
    'playwright.config.ts': 'export default {};\n',
    '.vscode/settings.json': '{ "editor.tabSize": 2 }\n',
    '.gitignore': 'node_modules\n',
    'pnpm-lock.yaml': '',
  };

  it('overwrites no file and says what to add', async () => {
    const dir = folder(files);
    const { output } = await run(dir);
    for (const file of ['playwright.config.ts', '.vscode/settings.json']) {
      expect(read(dir, file)).toBe(files[file as keyof typeof files]);
    }
    expect(JSON.parse(read(dir, 'package.json')).scripts.test).toBe('playwright test');
    expect(read(dir, '.gitignore')).toBe(
      'node_modules\n.features-gen/\nplaywright-report/\ntest-results/\nplaywright/.auth/\n.env\nsteps.json\n.vscode/plainwright.steps.js\n',
    );
    expect(output).toContain('Adding Plainwright to shop (pnpm).');
    expect(output).toContain('To run feature files with it, add:');
    // The same lines as docs/setup.md.
    expect(output).toContain(
      'aiFix: { promptAttachment: true, promptTemplate: aiFixPromptTemplate },',
    );
    expect(output).toContain(
      "use: { baseURL: 'http://localhost:9', actionTimeout: 10_000, trace: 'retain-on-failure' },",
    );
    expect(output).toContain('pnpm exec plainwright test runs the tests');
  });

  it('opens the address in the first test when pages/ belongs to the app', async () => {
    const dir = folder({
      'package.json': JSON.stringify({ name: 'next-app' }),
      'pages/index.tsx': 'export default function Home() {}\n',
    });
    const { output } = await run(dir);
    expect(fs.existsSync(path.join(dir, 'pages/start.json'))).toBe(false);
    expect(output).toContain(
      "skipped pages/start.json: pages/ holds your app's files (pages/index.tsx)",
    );
    expect(read(dir, 'features/example.feature')).toContain(
      '    * I open the url "/start"\n    * I see the url "/start"\n',
    );
  });

  it('replaces the test script npm writes into a new package.json', async () => {
    const dir = folder({
      'package.json': JSON.stringify({
        name: 'x',
        scripts: { test: 'echo "Error: no test specified" && exit 1' },
      }),
    });
    await run(dir);
    expect(JSON.parse(read(dir, 'package.json')).scripts.test).toBe('plainwright test');
  });
});

describe('the question for the AI assistant', () => {
  /** Answers the questions in turn and records them. */
  const asker = (answers: string[]) => {
    const questions: string[] = [];
    const ask = async (question: string, fallback: string) => {
      questions.push(question);
      return answers.shift() || fallback;
    };
    return { ask, questions };
  };

  it('takes a number, a name as for --ai, or the default', async () => {
    expect(await chooseAssistant(asker(['3']).ask)).toBe('claude');
    expect(await chooseAssistant(asker(['Copilot']).ask)).toBe('copilot');
    expect(await chooseAssistant(asker(['']).ask)).toBe('agents');
  });

  it('asks again until the answer is one of the choices', async () => {
    const { ask, questions } = asker(['claude code', '9', 'none']);
    expect(await chooseAssistant(ask)).toBe('none');
    expect(questions).toHaveLength(3);
    expect(questions[1]).toBe(
      '"claude code" is not one of them. Write a number from 1 to 4, or agents, copilot, claude, none',
    );
    expect(questions[2]).toMatch(/^"9" is not one of them/);
  });
});

describe('init helpers', () => {
  it('splits the address into base URL and start page', () => {
    expect(splitAddress(normalizeUrl('localhost:3000'))).toEqual({
      baseURL: 'http://localhost:3000',
      startPath: '/',
    });
    expect(splitAddress('https://shop.example.com/app/?lang=de')).toEqual({
      baseURL: 'https://shop.example.com',
      startPath: '/app/?lang=de',
    });
  });

  it('detects the package manager from the lock file', () => {
    expect(detectPackageManager(folder({ 'yarn.lock': '' }))).toBe('yarn');
    expect(detectPackageManager(folder({ 'bun.lock': '' }))).toBe('bun');
    expect(detectPackageManager(folder({ 'package-lock.json': '' }))).toBe('npm');
  });
});

describe("the editor's step list", () => {
  it('is updated by test and lint when it exists or the VS Code settings name it', () => {
    const settings = JSON.stringify({ 'cucumber.glue': [STUBS_FILE] });
    const cloned = folder({ '.vscode/settings.json': settings });
    refreshStubs(cloned);
    expect(read(cloned, STUBS_FILE)).toBe(renderStubs());

    const outdated = folder({ [STUBS_FILE]: '// old' });
    refreshStubs(outdated);
    expect(read(outdated, STUBS_FILE)).toBe(renderStubs());

    const without = folder({ '.vscode/settings.json': '{}' });
    refreshStubs(without);
    expect(fs.existsSync(path.join(without, STUBS_FILE))).toBe(false);

    const commented = folder({
      '.vscode/settings.json': `{\n  // "cucumber.glue": ["${STUBS_FILE}"]\n}`,
    });
    refreshStubs(commented);
    expect(fs.existsSync(path.join(commented, STUBS_FILE))).toBe(false);
  });

  it('does not stop test or lint when it cannot be written', () => {
    const blocked = folder();
    fs.mkdirSync(path.join(blocked, STUBS_FILE), { recursive: true });
    expect(() => refreshStubs(blocked)).not.toThrow();
  });
});
