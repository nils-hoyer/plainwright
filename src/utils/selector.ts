/**
 * Converts a BDD step element name to the camelCase property name
 * used in Page Object classes.
 *
 * Examples:
 *   "button login"      → "buttonLogin"
 *   "input user name"   → "inputUserName"
 *   "  Button  Login  " → "buttonLogin"
 */
export function labelToPropertyName(label: string): string {
  const words = label.trim().toLowerCase().split(/\s+/);
  return words
    .map((word, index) => (index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)))
    .join('');
}

/**
 * Resolves a BDD element reference to a CSS / XPath / Playwright selector string.
 *
 * The reference can be:
 *   1. A raw selector (starts with "/", ".", "#", "[", "text=", "role=", …)
 *      → returned as-is
 *
 *   2. A "PageObject > propertyName" reference, e.g. "login > button login"
 *      → looks up `buttonLogin` on the registered page object named "login"
 *
 *   3. A plain label, e.g. "button login"
 *      → looks up `buttonLogin` on the *active* page object
 *
 * Throws a descriptive error when a property cannot be found so the test
 * output points directly at the problem.
 */
export function resolveSelector(
  reference: string,
  activePageObject: Record<string, unknown> | null,
  pageObjectRegistry: Map<string, Record<string, unknown>>,
): string {
  const trimmed = reference.trim();

  // 1 – raw selector passthrough
  if (isRawSelector(trimmed)) {
    return trimmed;
  }

  // 2 – "PageObjectName > element label"
  if (trimmed.includes('>')) {
    const [pagePart, ...labelParts] = trimmed.split('>');
    const pageKey = pagePart.trim().toLowerCase();
    const label = labelParts.join('>').trim();
    const pageObj = pageObjectRegistry.get(pageKey);
    if (!pageObj) {
      throw new Error(
        `[playwright-bdd-steps] No page object registered under the name "${pageKey}". ` +
          `Available: ${[...pageObjectRegistry.keys()].join(', ') || '(none)'}`,
      );
    }
    return extractSelector(pageObj, label, pageKey);
  }

  // 3 – label on the active page object
  if (!activePageObject) {
    throw new Error(
      `[playwright-bdd-steps] Cannot resolve "${trimmed}": no active page object set. ` +
        `Call \`I use the page object "{name}"\` first, or pass a raw selector.`,
    );
  }

  return extractSelector(activePageObject, trimmed, '(active)');
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const RAW_SELECTOR_PREFIXES = ['/', '.', '#', '[', 'text=', 'role=', 'xpath=', 'css=', 'id='];

function isRawSelector(value: string): boolean {
  return RAW_SELECTOR_PREFIXES.some((prefix) => value.startsWith(prefix));
}

function extractSelector(
  pageObj: Record<string, unknown>,
  label: string,
  pageName: string,
): string {
  const propertyName = labelToPropertyName(label);
  const value = pageObj[propertyName];

  if (typeof value === 'string') {
    return value;
  }

  // Build a useful error listing available properties
  const available = Object.entries(pageObj)
    .filter(([, v]) => typeof v === 'string')
    .map(([k]) => k)
    .join(', ');

  throw new Error(
    `[playwright-bdd-steps] Property "${propertyName}" not found on page object "${pageName}". ` +
      `Available selectors: ${available || '(none)'}`,
  );
}
