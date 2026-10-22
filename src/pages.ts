import fs from 'node:fs';
import path from 'node:path';
import { globSync } from 'tinyglobby';
import { ELEMENT_TYPES, escapeRegExp, type ElementAlias, type ElementType } from './elements';

/**
 * An alias for one element type: `{ type: 'button', selector: '[data-testid=settings]' }` makes
 * only `the "Settings" button` use the selector. Without `type`, every type does.
 */
export type TypedAlias = { type?: ElementType; selector: ElementAlias };

export type PageOptions = {
  /**
   * Address of the page: absolute, or relative to `baseURL`. An address with `*` (any text
   * without `/`) or `**` (any text), or a RegExp, can only be checked, not opened.
   */
  url?: string | RegExp;
  /**
   * Aliases for elements without a usable visible name. The key is the name used in feature
   * files (`'Search'`). The value is a selector string or a function that returns a Locator, or
   * `{ type: 'button', selector }` when only that element type should use it; a list of those
   * when the same name means elements of different types. A key with name and type as written
   * in the step (`'"Settings" button'`) works too.
   */
  elements?: Record<string, ElementAlias | TypedAlias | TypedAlias[]>;
};

export type PageDefinition = {
  readonly name: string;
  readonly url?: string | RegExp;
  readonly elements: Readonly<Record<string, ElementAlias>>;
};

const pages = new Map<string, PageDefinition>();
const loadedFiles = new Set<string>();
/** The file of each page defined in a pages folder. */
const sources = new Map<string, string>();

/**
 * Defines a page that feature files can refer to by name:
 *
 *   definePage('Login', {
 *     url: '/login',
 *     elements: { Username: '[data-testid="input-username"]' },
 *   });
 *
 *   * I open the "Login" page
 */
export function definePage(
  name: string,
  options: PageOptions = {},
  /** Internal: the file the page comes from, for messages. */
  source?: string,
): PageDefinition {
  if (!name.trim()) throw new Error('[plainwright] definePage() needs a page name.');
  if (pages.has(name)) {
    const files = [sources.get(name), source].filter(Boolean);
    throw new Error(
      `[plainwright] The page "${name}" is defined twice` +
        (files.length ? ` (${files.join(', ')}).` : '.') +
        ' Page names must be different.',
    );
  }
  const elements = aliasesByLabel(options.elements ?? {}, (message) => {
    throw new Error(`[plainwright] ${source ? `${source}: ` : `The page "${name}": `}${message}`);
  });
  if (source) sources.set(name, source);
  const page: PageDefinition = Object.freeze({
    name,
    url: options.url,
    elements: Object.freeze(elements),
  });
  pages.set(name, page);
  return page;
}

/**
 * The aliases as the lookup uses them: `{ Settings: { type: 'button', selector } }` becomes
 * `{ '"Settings" button': selector }`; the other forms stay as they are.
 */
function aliasesByLabel(
  elements: NonNullable<PageOptions['elements']>,
  fail: (message: string) => never,
): Record<string, ElementAlias> {
  const result: Record<string, ElementAlias> = {};
  const add = (key: string, alias: ElementAlias) => {
    if (Object.hasOwn(result, key)) fail(`The element ${key} has two aliases.`);
    result[key] = alias;
  };
  for (const [name, value] of Object.entries(elements)) {
    if (typeof value === 'string' || typeof value === 'function') {
      add(name, value);
      continue;
    }
    for (const { type, selector } of [value].flat()) {
      if (type !== undefined && !ELEMENT_TYPES.includes(type)) {
        fail(
          `"${type}" is not an element type, in the alias "${name}". Use one of: ${ELEMENT_TYPES.join(', ')}.`,
        );
      }
      add(type ? `"${name}" ${type}` : name, selector);
    }
  }
  return result;
}

/** The file in a pages folder the page comes from, relative to the project folder, if any. */
export function getPageSource(name: string): string | undefined {
  return sources.get(name);
}

export function getPageDefinition(name: string): PageDefinition {
  const page = pages.get(name);
  if (page) return page;
  const known = [...pages.keys()].map((n) => `"${n}"`).join(', ') || '(none)';
  const app = appPagesFile();
  throw new Error(
    `[plainwright] No page named "${name}". Defined pages: ${known}. ` +
      (app
        ? `pages/ holds your app's files (${app}), so Plainwright loads no pages from it: ` +
          `open the address with I open the url "/...", or load page files from another folder with definePages().`
        : `Add it as a file in pages/: { "name": "${name}", "url": "/..." }.`),
  );
}

/** App source files: a `pages/` folder with them belongs to Next.js, Nuxt, Astro and the like. */
const APP_PAGES = 'pages/**/*.{js,jsx,ts,tsx,mjs,cjs,vue,svelte,astro,md,mdx}';

/** An app source file in `pages/`, such as `pages/index.tsx`, if the folder belongs to the app. */
export function appPagesFile(cwd = process.cwd()): string | undefined {
  return globSync(APP_PAGES, { cwd, ignore: ['**/node_modules/**'] })[0];
}

export function getPageDefinitions(): PageDefinition[] {
  return [...pages.values()];
}

/**
 * Defines the pages in a folder of JSON files, one page per file:
 *
 *   // pages/orders.json
 *   { "name": "Orders", "url": "/orders", "elements": { "Search": "[data-testid=search]" } }
 *
 * `url` may contain `*` (any text without `/`) and `**` (any text); such a page can only be
 * checked. `pages/` in the project folder loads by itself. The path is relative to the current
 * working directory, like defineKeywords(); files that are already loaded are skipped.
 */
export function definePages(folder: string, options: { cwd?: string } = {}): PageDefinition[] {
  const root = path.resolve(options.cwd ?? process.cwd(), folder);
  const files = globSync('**/*.json', { cwd: root, absolute: true }).sort();
  return files.filter((file) => !loadedFiles.has(file)).map(definePageFile);
}

function definePageFile(file: string): PageDefinition {
  const rel = path.relative(process.cwd(), file) || file;
  let page: unknown;
  try {
    page = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    throw new Error(`[plainwright] ${rel}: Not valid JSON. ${(error as Error).message}`);
  }
  const fail = (message: string) => {
    throw new Error(`[plainwright] ${rel}: ${message}`);
  };
  if (!isObject(page)) return fail('Write the page as { "name": "Login", "url": "/login" }.');
  const unknown = Object.keys(page).find((key) => !PAGE_KEYS.includes(key));
  if (unknown) return fail(`"${unknown}" is not part of a page. A page has ${PAGE_KEYS_TEXT}.`);
  if (typeof page.name !== 'string' || !page.name.trim()) {
    return fail('The page needs a "name", the name tests use: I open the "Login" page.');
  }
  if (page.url !== undefined && typeof page.url !== 'string') {
    return fail('The "url" of the page must be text, e.g. "/login".');
  }
  const elements = page.elements;
  if (elements !== undefined && !isObject(elements)) {
    return fail(`Write "elements" as { "Name": "selector" }, or ${TYPED_ALIAS}.`);
  }
  for (const [name, value] of Object.entries(elements ?? {})) {
    if (typeof value === 'string') continue;
    const items = [value].flat();
    const valid = items.every(
      (item) =>
        isObject(item) &&
        typeof item.selector === 'string' &&
        (item.type === undefined || typeof item.type === 'string') &&
        Object.keys(item).every((key) => key === 'type' || key === 'selector'),
    );
    if (!valid || !items.length) {
      return fail(`Write the alias "${name}" as "selector", or ${TYPED_ALIAS}.`);
    }
  }
  loadedFiles.add(file);
  return definePage(
    page.name,
    { url: page.url, elements: elements as PageOptions['elements'] },
    rel,
  );
}

const PAGE_KEYS = ['$schema', 'name', 'url', 'elements'];
const TYPED_ALIAS = '{ "type": "button", "selector": "selector" } for one element type';
const PAGE_KEYS_TEXT = '"name", "url" and "elements"';

/**
 * Matches an address with any query string or hash. In a page's address, `*` stands for any
 * text without `/`, `**` for any text. `resolve` makes a relative address absolute.
 */
export function addressPattern(url: string | RegExp, resolve: (path: string) => string): RegExp {
  if (url instanceof RegExp) return url;
  const resolved = resolve(url);
  const start = /^[a-z]+:\/\//i.test(resolved) ? '^' : '';
  const pattern = resolved
    .split(/(\*\*|\*)/)
    .map((part) => (part === '**' ? '.*' : part === '*' ? '[^/?#]*' : escapeRegExp(part)))
    .join('');
  return new RegExp(`${start}${pattern}(?:[?#].*)?$`);
}

/**
 * The pages the browser shows at this address, most specific first: those with exactly this
 * address, then those with `*` in theirs, then pages without an address, which apply everywhere.
 */
export function pagesAt(address: string, resolve: (path: string) => string): PageDefinition[][] {
  const ranks: PageDefinition[][] = [[], [], []];
  for (const page of pages.values()) {
    if (page.url === undefined) ranks[2].push(page);
    else if (addressPattern(page.url, resolve).test(address)) {
      ranks[isUrlPattern(page.url) ? 1 : 0].push(page);
    }
  }
  return ranks;
}

/** Whether the address has `*`, so it can only be checked, not opened. */
export function isUrlPattern(url: string | RegExp | undefined): boolean {
  return url instanceof RegExp || (typeof url === 'string' && url.includes('*'));
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
