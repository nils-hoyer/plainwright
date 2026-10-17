import { parseAriaSnapshot } from './aria';
import { ELEMENT_TYPES, elementTypeOfRole, ElementType, labelOf, PLURAL } from './elements';

export type InspectResult = {
  url: string;
  title: string;
  /** Visible names per element type, e.g. `{ button: ['Log in'] }`. */
  elements: Partial<Record<ElementType, string[]>>;
  /** How many elements of a type have no name; they need an alias. */
  unnamed: Partial<Record<ElementType, number>>;
};

export type InspectOptions = { baseURL?: string; storageState?: string };

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
    return { url: page.url(), title: await page.title(), ...groupSnapshot(snapshot) };
  } finally {
    await browser.close();
  }
}

export function groupSnapshot(snapshot: string): Pick<InspectResult, 'elements' | 'unnamed'> {
  const elements: InspectResult['elements'] = {};
  const unnamed: InspectResult['unnamed'] = {};
  for (const node of parseAriaSnapshot(snapshot)) {
    const type = elementTypeOfRole(node.role);
    if (!type) continue;
    const name = labelOf(type, node);
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
  for (const type of ELEMENT_TYPES) {
    const names = result.elements[type];
    if (!names?.length) continue;
    lines.push(PLURAL[type]);
    for (const name of names) lines.push(`  the "${name}" ${type}`);
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
