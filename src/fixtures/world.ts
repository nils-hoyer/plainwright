import { test as base, createBdd } from 'playwright-bdd';
import type { FrameLocator, Locator, Page } from '@playwright/test';
import { resolveSelector } from '../utils/selector';

export type World = {
  /** Registry of all page objects, keyed by lowercase name */
  pageObjectRegistry: Map<string, Record<string, unknown>>;
  /** Currently active page object (set via "I use the page object …") */
  activePageObject: Record<string, unknown> | null;
  /** Currently active FrameLocator (set via "I switch to frame …"), or null for main frame. */
  activeFrameLocator: FrameLocator | null;
  /** Resolve a BDD element reference to a Playwright selector string */
  resolve(reference: string): string;
  /**
   * Returns the active interaction context: the active FrameLocator when inside an
   * iframe, otherwise the active Page (honours tab switching).
   */
  getContext(page: Page): Page | FrameLocator;
  /**
   * Returns a Locator for `selector`, respecting the active frame and active page.
   * Use this instead of `page.locator()` in all step definitions.
   */
  locator(page: Page, selector: string): Locator;
  /**
   * Returns the currently active Page. After "I switch to tab N" this returns the
   * switched-to page instead of the original fixture page.
   */
  getPage(page: Page): Page;
  /** Register a page object so it can be referenced by name */
  registerPageObject(name: string, pageObject: Record<string, unknown>): void;
  /** Activate a previously registered page object */
  usePageObject(name: string): void;
  /** Switch the active page (called by tab-switching steps). Clears any active frame. */
  setActivePage(page: Page): void;
  /** Set or clear the active FrameLocator (called by frame-switching steps). */
  setFrameLocator(frameLocator: FrameLocator | null): void;
};

export const test = base.extend<{ world: World }>({
  world: async ({}, use) => {
    const registry = new Map<string, Record<string, unknown>>();
    let active: Record<string, unknown> | null = null;
    let activePage: Page | null = null;
    let activeFrame: FrameLocator | null = null;

    const world: World = {
      pageObjectRegistry: registry,
      get activePageObject() {
        return active;
      },
      get activeFrameLocator() {
        return activeFrame;
      },
      resolve(reference: string) {
        return resolveSelector(reference, active, registry);
      },
      getContext(page: Page): Page | FrameLocator {
        if (activeFrame) return activeFrame;
        return activePage ?? page;
      },
      locator(page: Page, selector: string): Locator {
        if (activeFrame) return activeFrame.locator(selector);
        return (activePage ?? page).locator(selector);
      },
      getPage(page: Page): Page {
        return activePage ?? page;
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
      setActivePage(page: Page) {
        activePage = page;
        activeFrame = null; // reset frame context when switching tabs
      },
      setFrameLocator(frameLocator: FrameLocator | null) {
        activeFrame = frameLocator;
      },
    };

    await use(world);
  },
});

export const { Given, When, Then } = createBdd(test);
