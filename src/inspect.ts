import type { Locator, Page } from '@playwright/test';
import { parseAriaSnapshot } from './aria';
import {
  ElementAlias,
  ELEMENT_TYPES,
  elementTypeOfRole,
  ElementType,
  labelOf,
  PLURAL,
} from './elements';

export type InspectResult = {
  url: string;
  title: string;
  /** Visible names per element type, e.g. `{ button: ['Log in'] }`. */
  elements: Partial<Record<ElementType, string[]>>;
  /** How many elements of a type have no name and no alias; they need an alias. */
  unnamed: Partial<Record<ElementType, number>>;
  /** The aliases of the page (from its file in pages/) and how many elements each finds. */
  aliases?: { name: string; type?: ElementType; count: number }[];
  /** The address asked for, when the page sent the browser elsewhere, e.g. to a login page. */
  redirectedFrom?: string;
};

export type InspectOptions = {
  baseURL?: string;
  storageState?: string;
  /** The aliases of the page being inspected, so elements they find count as named. */
  aliases?: Readonly<Record<string, ElementAlias>>;
};

/**
 * Opens the page in Chromium and lists its elements by type and visible name,
 * from `ariaSnapshot()`, so steps use names that exist.
 */
export async function inspectPage(
  url: string,
  options: InspectOptions = {},
): Promise<InspectResult> {
  const { chromium } = await import('@playwright/test');
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({
      baseURL: options.baseURL,
      storageState: options.storageState,
    });
    const page = await context.newPage();
    await page.goto(url);
    const snapshot = await page.locator('body').ariaSnapshot();
    const { elements, unnamed } = groupSnapshot(snapshot);
    const aliases = options.aliases && (await countAliases(page, options.aliases, unnamed));
    // Also a redirect in the page's own script, as single-page apps do to a login page.
    const requested = new URL(url, options.baseURL).toString();
    return {
      url: page.url(),
      title: await page.title(),
      elements,
      unnamed,
      ...(aliases ? { aliases } : {}),
      ...(samePath(requested, page.url()) ? {} : { redirectedFrom: requested }),
    };
  } finally {
    await browser.close();
  }
}

/**
 * How many elements each alias finds. Elements without a name that an alias finds no longer
 * count in `unnamed`.
 */
async function countAliases(
  page: Page,
  aliases: Readonly<Record<string, ElementAlias>>,
  unnamed: InspectResult['unnamed'],
): Promise<NonNullable<InspectResult['aliases']>> {
  const result = [];
  for (const [name, alias] of Object.entries(aliases)) {
    const locator: Locator = typeof alias === 'string' ? page.locator(alias) : alias(page);
    const count = await locator.count().catch(() => 0);
    let firstType: ElementType | undefined;
    for (let i = 0; i < Math.min(count, 20); i++) {
      const snapshot = await locator
        .nth(i)
        .ariaSnapshot({ timeout: 2000 })
        .catch(() => '');
      const node = parseAriaSnapshot(snapshot)[0];
      const type = node && elementTypeOfRole(node.role);
      firstType ??= type;
      if (type && !labelOf(type, node) && unnamed[type]) {
        unnamed[type] -= 1;
        if (!unnamed[type]) delete unnamed[type];
      }
    }
    result.push({ name, ...(firstType ? { type: firstType } : {}), count });
  }
  return result;
}

function samePath(a: string, b: string) {
  const path = (url: string) => new URL(url).pathname.replace(/\/+$/, '');
  return path(a) === path(b);
}

export function groupSnapshot(snapshot: string): Pick<InspectResult, 'elements' | 'unnamed'> {
  const elements: InspectResult['elements'] = {};
  const unnamed: InspectResult['unnamed'] = {};
  for (const node of parseAriaSnapshot(snapshot)) {
    const type = elementTypeOfRole(node.role);
    if (!type) continue;
    const name = labelOf(type, node);
    // An empty status or alert area waits for a message; it needs no name.
    if (!name && type === 'message' && !node.descendants.length) continue;
    if (!name) {
      unnamed[type] = (unnamed[type] ?? 0) + 1;
    } else if (!elements[type]?.includes(name)) {
      (elements[type] ??= []).push(name);
    }
  }
  return { elements, unnamed };
}

export function formatInspectResult(result: InspectResult): string {
  const lines = [`${result.url}  (title: "${result.title}")`, ''];
  if (result.redirectedFrom) {
    lines.push(
      `The page sent the browser from ${result.redirectedFrom} to ${result.url}.`,
      'If it needs a login, pass a logged-in session: --storage-state <file>, see https://github.com/nils-hoyer/plainwright/blob/main/docs/logging-in.md',
      '',
    );
  }
  for (const type of ELEMENT_TYPES) {
    const names = result.elements[type];
    if (!names?.length) continue;
    lines.push(PLURAL[type]);
    for (const name of names) lines.push(`  the "${name}" ${type}`);
    lines.push('');
  }
  if (result.aliases?.length) {
    lines.push('Aliases of this page');
    for (const { name, type, count } of result.aliases) {
      // A key like `"Settings" button` already says how a step names the element.
      const written = name.startsWith('"') ? `the ${name}` : `the "${name}" ${type ?? 'element'}`;
      const found = count === 0 ? 'finds nothing' : count === 1 ? '' : `finds ${count} elements`;
      lines.push(`  ${written}${found ? `  (${found})` : ''}`);
    }
    lines.push('');
  }
  const unnamed = ELEMENT_TYPES.filter((type) => result.unnamed[type]);
  if (unnamed.length) {
    lines.push('Without a visible name (give them an alias in their page file in pages/):');
    for (const type of unnamed) lines.push(`  ${result.unnamed[type]} × ${type}`);
    lines.push('');
  }
  return lines.join('\n');
}
