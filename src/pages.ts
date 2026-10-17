import fs from 'node:fs';
import path from 'node:path';
import { globSync } from 'tinyglobby';
import type { ElementAlias } from './elements';

export type PageOptions = {
  /**
   * Address of the page: absolute, or relative to `baseURL`. An address with `*` (any text
   * without `/`) or `**` (any text), or a RegExp, can only be checked, not opened.
   */
  url?: string | RegExp;
  /**
   * Aliases for elements without a usable visible name. The key is the name used in feature
   * files (`'Search'`), or name and type as written in the step (`'"Settings" button'`) when
   * the same name means different elements. Value: a selector string, or a function that
   * returns a Locator.
   */
  elements?: Record<string, ElementAlias>;
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
 *     url: '/login.html',
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
  if (source) sources.set(name, source);
  const page: PageDefinition = Object.freeze({
    name,
    url: options.url,
    elements: Object.freeze({ ...options.elements }),
  });
  pages.set(name, page);
  return page;
}

export function getPageDefinition(name: string): PageDefinition {
  const page = pages.get(name);
  if (page) return page;
  const known = [...pages.keys()].map((n) => `"${n}"`).join(', ') || '(none)';
  throw new Error(
    `[plainwright] No page named "${name}". Defined pages: ${known}. ` +
      `Add it as a file in pages/: { "name": "${name}", "url": "/..." }.`,
  );
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
  if (
    elements !== undefined &&
    (!isObject(elements) || Object.values(elements).some((value) => typeof value !== 'string'))
  ) {
    return fail('Write "elements" as { "Name": "selector" }.');
  }
  loadedFiles.add(file);
  return definePage(
    page.name,
    { url: page.url, elements: elements as Record<string, string> | undefined },
    rel,
  );
}

const PAGE_KEYS = ['$schema', 'name', 'url', 'elements'];
const PAGE_KEYS_TEXT = '"name", "url" and "elements"';

/** Whether the address has `*`, so it can only be checked, not opened. */
export function isUrlPattern(url: string | RegExp | undefined): boolean {
  return url instanceof RegExp || (typeof url === 'string' && url.includes('*'));
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
