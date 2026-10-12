import type { ElementAlias } from './elements';

export type PageOptions = {
  /** Address of the page: absolute, or relative to `baseURL`. A RegExp can only be checked, not opened. */
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
