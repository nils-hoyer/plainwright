import { test as base, createBdd } from 'playwright-bdd';
import { resolveSelector } from '../utils/selector';

export type World = {
  /** Registry of all page objects, keyed by lowercase name */
  pageObjectRegistry: Map<string, Record<string, unknown>>;
  /** Currently active page object (set via "I use the page object …") */
  activePageObject: Record<string, unknown> | null;
  /** Resolve a BDD element reference to a Playwright selector string */
  resolve(reference: string): string;
  /** Register a page object so it can be referenced by name */
  registerPageObject(name: string, pageObject: Record<string, unknown>): void;
  /** Activate a previously registered page object */
  usePageObject(name: string): void;
};

export const test = base.extend<{ world: World }>({
  world: async ({}, use) => {
    const registry = new Map<string, Record<string, unknown>>();
    let active: Record<string, unknown> | null = null;

    const world: World = {
      pageObjectRegistry: registry,
      get activePageObject() {
        return active;
      },
      resolve(reference: string) {
        return resolveSelector(reference, active, registry);
      },
      registerPageObject(name: string, pageObject: Record<string, unknown>) {
        registry.set(name.trim().toLowerCase(), pageObject);
      },
      usePageObject(name: string) {
        const key = name.trim().toLowerCase();
        const po = registry.get(key);
        if (!po) {
          throw new Error(
            `[playwright-bdd-steps] Page object "${key}" not found in registry. ` +
              `Available: ${[...registry.keys()].join(', ') || '(none)'}`,
          );
        }
        active = po;
      },
    };

    await use(world);
  },
});

export const { Given, When, Then } = createBdd(test);
