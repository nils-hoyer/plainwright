import type { Locator, Page } from '@playwright/test';
import { parseAriaSnapshot } from './aria';
import {
  ElementAlias,
  ELEMENT_TYPES,
  clickableNodes,
  elementTypeOfRole,
  ElementType,
  labelOf,
  ownEntry,
  PLURAL,
} from './elements';

export type InspectResult = {
  url: string;
  title: string;
  /** Visible names per element type, e.g. `{ button: ['Log in'] }`. */
  elements: Partial<Record<ElementType, string[]>>;
  /** How many elements of a type have no name and no alias; they need an alias. */
  unnamed: Partial<Record<ElementType, number>>;
  /** Names that more than one element of a type has, with how many: `{ button: { Delete: 3 } }`. */
  repeated?: Partial<Record<ElementType, Record<string, number>>>;
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
    let requested: string;
    try {
      requested = new URL(url, options.baseURL).toString();
    } catch {
      throw new Error(
        `"${url}" is not a full address, and there is no base URL. Pass --base-url ` +
          `http://localhost:3000, or set baseURL in playwright.config.ts.`,
      );
    }
    try {
      await page.goto(url);
    } catch (error) {
      if (NO_ANSWER.test(String((error as Error).message))) {
        throw new Error(`${requested} does not answer. Start your app, then run inspect again.`);
      }
      throw error;
    }
    const snapshot = await page.locator('body').ariaSnapshot();
    const { elements, unnamed, repeated } = groupSnapshot(snapshot);
    const aliases = options.aliases && (await countAliases(page, options.aliases, unnamed));
    // Also a redirect in the page's own script, as single-page apps do to a login page.
    return {
      url: page.url(),
      title: await page.title(),
      elements,
      unnamed,
      ...(repeated ? { repeated } : {}),
      ...(aliases ? { aliases } : {}),
      ...(samePath(requested, page.url()) ? {} : { redirectedFrom: requested }),
    };
  } finally {
    await browser.close();
  }
}

/** Browser errors for an address where nothing answers, such as an app that is not running. */
const NO_ANSWER =
  /net::ERR_(CONNECTION_\w+|NAME_NOT_RESOLVED|ADDRESS_UNREACHABLE|EMPTY_RESPONSE|INTERNET_DISCONNECTED)/;

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

export function groupSnapshot(
  snapshot: string,
): Pick<InspectResult, 'elements' | 'unnamed' | 'repeated'> {
  const elements: InspectResult['elements'] = {};
  const unnamed: InspectResult['unnamed'] = {};
  const counts: Partial<Record<ElementType, Record<string, number>>> = {};
  for (const node of clickableNodes(parseAriaSnapshot(snapshot))) {
    const type = elementTypeOfRole(node.role);
    if (!type) continue;
    const name = labelOf(type, node);
    // An empty status or alert area waits for a message; it needs no name.
    if (!name && type === 'message' && !node.descendants.length) continue;
    if (!name) {
      unnamed[type] = (unnamed[type] ?? 0) + 1;
      continue;
    }
    const count = (counts[type] ??= {});
    if (!count[name]) (elements[type] ??= []).push(name);
    count[name] = (count[name] ?? 0) + 1;
  }
  const repeated: NonNullable<InspectResult['repeated']> = {};
  for (const [type, count] of Object.entries(counts) as [ElementType, Record<string, number>][]) {
    const more = Object.entries(count).filter(([, n]) => n > 1);
    if (more.length) repeated[type] = Object.fromEntries(more);
  }
  return { elements, unnamed, ...(Object.keys(repeated).length ? { repeated } : {}) };
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
    for (const name of names) {
      const count = ownEntry(result.repeated?.[type], name);
      lines.push(`  the "${name}" ${type}${count ? `  (${count} on this page)` : ''}`);
    }
    lines.push('');
  }
  if (result.repeated && Object.keys(result.repeated).length) {
    lines.push(
      'A step cannot tell elements with the same name apart. Name the element it is in:',
      '  the "Delete" button in the "Order 1001" row',
      '',
    );
  }
  if (result.aliases?.length) {
    lines.push('Aliases of this page');
    for (const { name, type, count } of result.aliases) {
      const written = `the "${name}" ${type ?? 'element'}`;
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
