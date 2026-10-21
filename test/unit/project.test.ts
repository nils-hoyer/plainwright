import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { beforeAll, describe, expect, it, vi } from 'vitest';

const cwd = path.join(__dirname, 'fixtures/project');

/** The package as a project in fixtures/project loads it: with .env, pages/, data/, keywords/. */
async function load() {
  vi.resetModules();
  const spy = vi.spyOn(process, 'cwd').mockReturnValue(cwd);
  try {
    return {
      library: await import('../../src/index'),
      values: await import('../../src/values'),
      lint: await import('../../src/lint'),
      catalog: await import('../../src/catalog'),
    };
  } finally {
    spy.mockRestore();
  }
}

describe('project files', () => {
  let loaded: Awaited<ReturnType<typeof load>>;
  beforeAll(async () => {
    process.env.PLAINWRIGHT_UNIT_SET = 'from-environment';
    loaded = await load();
  });

  it('loads .env without overriding variables that are set', () => {
    expect(process.env.PLAINWRIGHT_UNIT_SECRET).toBe('from-dotenv');
    expect(process.env.PLAINWRIGHT_UNIT_SET).toBe('from-environment');
  });

  it('loads pages/, one page per file', () => {
    const pages = loaded.library.getPageDefinitions();
    expect(pages.map((page) => [page.name, page.url])).toEqual([
      ['Login', '/login'],
      ['Order', '/orders/*'],
      ['Orders', '/orders'],
    ]);
    expect(pages[2].elements).toEqual({ Search: '[data-testid=search]' });
  });

  it('loads keywords/', () => {
    expect(loaded.library.getKeywords().map((keyword) => keyword.title)).toEqual([
      'there is an order called "<name>"',
    ]);
  });

  it('skips keyword and page files that are already loaded', () => {
    loaded.library.defineKeywords('keywords/**/*.feature', { cwd });
    expect(loaded.library.getKeywords()).toHaveLength(1);
    expect(loaded.library.definePages('pages', { cwd })).toEqual([]);
  });

  it('skips data files whose names a step cannot write', () => {
    expect(loaded.values.getDataFiles().map((file) => file.name)).not.toContain('not usable');
  });

  it('names data files by their path in data/', () => {
    expect(loaded.values.getDataFiles().map((file) => file.name)).toEqual([
      'shop.products',
      'users',
    ]);
  });
});

describe('page files', () => {
  /** A folder with these files, and a fresh copy of the package. */
  async function folder(files: Record<string, string>) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'plainwright-pages-'));
    for (const [file, content] of Object.entries(files)) {
      fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
      fs.writeFileSync(path.join(dir, file), content);
    }
    vi.resetModules();
    return { dir, library: await import('../../src/index') };
  }

  it('need a name and nothing but name, url and elements', async () => {
    const noName = await folder({ 'pages/login.json': '{ "url": "/login" }' });
    expect(() => noName.library.definePages('pages', { cwd: noName.dir })).toThrow(
      'The page needs a "name"',
    );
    const extra = await folder({ 'pages/login.json': '{ "name": "Login", "path": "/login" }' });
    expect(() => extra.library.definePages('pages', { cwd: extra.dir })).toThrow(
      '"path" is not part of a page. A page has "name", "url" and "elements".',
    );
  });

  it('name both files when two pages have the same name', async () => {
    const { dir, library } = await folder({
      'pages/login.json': '{ "name": "Login", "url": "/login" }',
      'pages/sign-in.json': '{ "name": "Login", "url": "/sign-in" }',
    });
    const spy = vi.spyOn(process, 'cwd').mockReturnValue(dir);
    try {
      expect(() => library.definePages('pages', { cwd: dir })).toThrow(
        `The page "Login" is defined twice (${path.join('pages', 'login.json')}, ${path.join('pages', 'sign-in.json')}).`,
      );
    } finally {
      spy.mockRestore();
    }
  });

  it("are not loaded from an app's pages/ folder", async () => {
    const { dir } = await folder({
      'pages/index.tsx': 'export default function Home() {}',
      'pages/data.json': '{ "title": "not a page" }',
    });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.resetModules();
    const { loadProjectFiles } = await import('../../src/project');
    const { getPageDefinitions } = await import('../../src/pages');
    loadProjectFiles(dir);
    expect(getPageDefinitions()).toEqual([]);
    expect(warn.mock.calls[0][0]).toContain('pages/ holds app files such as pages/index.tsx');
    warn.mockRestore();
  });
});

describe('values', () => {
  let values: Awaited<ReturnType<typeof load>>['values'];
  beforeAll(async () => {
    values = (await load()).values;
  });

  it('fills in data, environment variables and remembered values', () => {
    values.remember('order', { id: 7 });
    expect(
      values.resolveText('{users.admin.name} ordered {order.id} for {shop.products.coffee.price}'),
    ).toBe('Ada ordered 7 for 3.5');
    expect(values.resolveText('{env.PLAINWRIGHT_UNIT_SECRET}')).toBe('from-dotenv');
  });

  it('fills in values inside data files, with the same {unique} in one test', () => {
    const email = values.resolveText('{users.admin.email}');
    expect(email).toMatch(/^admin-[a-z0-9]{6,}@example\.com$/);
    expect(values.resolveText('admin-{unique}@example.com')).toBe(email);
  });

  it('returns objects as JSON text, or as is with raw', () => {
    expect(values.resolveText('{shop.products.coffee}')).toBe('{"price":3.5}');
    expect(values.resolveRaw('{shop.products.coffee}')).toEqual({ price: 3.5 });
    expect(values.resolveRaw('costs {shop.products.coffee.price}')).toBe('costs 3.5');
  });

  it('keeps braces after a backslash and text that is no reference', () => {
    expect(values.resolveText('\\{users.admin.name}')).toBe('{users.admin.name}');
    expect(values.resolveText('{"a": 1} and { spaced }')).toBe('{"a": 1} and { spaced }');
  });

  it('hides environment values in the report', () => {
    const used: { reference: string; shown: string }[] = [];
    values.resolveText('{env.PLAINWRIGHT_UNIT_SECRET} {users.admin.name}', used);
    expect(used).toEqual([
      { reference: 'env.PLAINWRIGHT_UNIT_SECRET', shown: '(hidden)' },
      { reference: 'users.admin.name', shown: '"Ada"' },
    ]);
  });

  it('explains unknown values', () => {
    expect(() => values.resolveText('{users.admin.phone}')).toThrow(
      'No value {users.admin.phone}: {users.admin} has no "phone". It has "email", "name".',
    );
    expect(() => values.resolveText('{nothing}')).toThrow(
      'No value named "nothing" for {nothing}.',
    );
    expect(() => values.resolveText('{env.PLAINWRIGHT_UNIT_MISSING}')).toThrow(
      'The environment variable PLAINWRIGHT_UNIT_MISSING is not set.',
    );
    expect(() => values.resolveText('{users.loop}')).toThrow(
      'Values refer to each other in a loop: {users.loop} → {users.loop}.',
    );
  });

  it('rejects reserved and invalid names', () => {
    expect(() => values.remember('env', 1)).toThrow('"env" is reserved');
    expect(() => values.remember('two words', 1)).toThrow('may only contain');
  });

  it('finds the references in a text', () => {
    expect(values.referencesIn('{a.b} \\{c} {d}')).toEqual(['a.b', 'd']);
  });
});

describe('lint with project files', () => {
  it('reports unknown pages and values, and knows remembered ones', async () => {
    const { lint } = await load();
    const spy = vi.spyOn(process, 'cwd').mockReturnValue(cwd);
    const messages = lint
      .lintFeatures([path.join(cwd, 'features/values.feature')], cwd)
      .filter((message) => message.rule === 'unknown-value' || message.rule === 'unknown-page');
    spy.mockRestore();
    expect(messages.map((message) => `${message.line}: ${message.message}`)).toEqual([
      '6: No value {users.admin.phone}: {users.admin} has no "phone". It has "email", "name".',
      expect.stringMatching(
        /^7: No value named "nothing" for \{nothing\}\. Known values: \{shop\.products\}, \{users\}/,
      ),
      '8: The environment variable ANYTHING is not set. Set it, or add it to the .env file, before the tests run.',
      '16: No page named "Checkout". Defined pages: "Login", "Order", "Orders".',
    ]);
  });
});

describe('catalog', () => {
  it('lists data values and the built-in ones', async () => {
    const { catalog } = await load();
    const names = catalog.buildCatalog(cwd).values.map((value) => value.name);
    expect(names).toEqual([
      'shop.products',
      'shop.products.coffee',
      'shop.products.coffee.price',
      'users',
      'users.admin',
      'users.admin.email',
      'users.admin.name',
      'users.loop',
      'env.NAME',
      'unique',
      'today',
      'response',
    ]);
  });
});
