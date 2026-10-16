import fs from 'node:fs';
import path from 'node:path';
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
export function definePage(name: string, options: PageOptions = {}): PageDefinition {
  if (!name.trim()) throw new Error('[plainwright] definePage() needs a page name.');
  if (pages.has(name)) {
    throw new Error(`[plainwright] The page "${name}" is defined twice.`);
  }
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
      `Define it with definePage('${name}', { url: '...' }).`,
  );
}

export function getPageDefinitions(): PageDefinition[] {
  return [...pages.values()];
}

/**
 * Defines the pages in a JSON file. The key is the page name, the value its address, or an
 * object with `url` and `elements` (aliases as selectors):
 *
 *   {
 *     "Login": "/login",
 *     "Order": "/orders/*",
 *     "Orders": { "url": "/orders", "elements": { "Search": "[data-testid=search]" } }
 *   }
 *
 * `pages.json` in the project folder loads by itself. The path is relative to the current
 * working directory, like defineKeywords(); a file that is already loaded is skipped.
 */
export function definePages(file: string, options: { cwd?: string } = {}): PageDefinition[] {
  const absolute = path.resolve(options.cwd ?? process.cwd(), file);
  if (loadedFiles.has(absolute)) return [];
  const rel = path.relative(process.cwd(), absolute) || absolute;
  let content: unknown;
  try {
    content = JSON.parse(fs.readFileSync(absolute, 'utf8'));
  } catch (error) {
    throw new Error(`[plainwright] ${rel}: ${(error as Error).message}`);
  }
  if (!isObject(content)) {
    throw new Error(`[plainwright] ${rel}: Write the pages as { "Page name": "/address" }.`);
  }
  loadedFiles.add(absolute);
  const defined: PageDefinition[] = [];
  for (const [name, entry] of Object.entries(content)) {
    if (name === '$schema') continue;
    const where = `[plainwright] ${rel}: The page "${name}"`;
    if (typeof entry === 'string') {
      defined.push(definePage(name, { url: entry }));
      continue;
    }
    if (!isObject(entry)) {
      throw new Error(`${where} needs an address ("/...") or { "url": "/..." }.`);
    }
    const unknown = Object.keys(entry).filter((key) => key !== 'url' && key !== 'elements');
    if (unknown.length) {
      throw new Error(`${where} has "${unknown[0]}". A page has only "url" and "elements".`);
    }
    if (entry.url !== undefined && typeof entry.url !== 'string') {
      throw new Error(`${where} needs its "url" as text.`);
    }
    if (entry.elements !== undefined) {
      const elements = entry.elements;
      if (!isObject(elements) || Object.values(elements).some((v) => typeof v !== 'string')) {
        throw new Error(`${where} needs "elements" as { "Name": "selector" }.`);
      }
    }
    defined.push(
      definePage(name, {
        url: entry.url as string | undefined,
        elements: entry.elements as Record<string, string> | undefined,
      }),
    );
  }
  return defined;
}

/** Whether the address has `*`, so it can only be checked, not opened. */
export function isUrlPattern(url: string | RegExp | undefined): boolean {
  return url instanceof RegExp || (typeof url === 'string' && url.includes('*'));
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
