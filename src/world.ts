import type {
  BrowserContext,
  Dialog,
  Download,
  FrameLocator,
  Locator,
  Page,
} from '@playwright/test';
import { describeMissing, ElementRef, locate, Scope } from './elements';
import { getPageDefinition, PageDefinition } from './pages';

export type WorldOptions = {
  baseURL?: string;
  /** Match element names exactly (default) or as case-insensitive substrings. */
  exactNames: boolean;
};

export type DialogRecord = { type: string; message: string };

type DialogAction = { accept: boolean; promptText?: string };

/**
 * State shared by the steps of one scenario: the active tab, frame and page definition,
 * dialogs that were shown and the last download.
 */
export class World {
  readonly baseURL?: string;
  readonly exactNames: boolean;
  /** Every dialog shown during the scenario, in order. */
  readonly dialogs: DialogRecord[] = [];
  /** The file from the last "I download the file with the ..." step. */
  download?: Download;

  #page: Page;
  #frame: FrameLocator | null = null;
  #currentPage?: PageDefinition;
  #nextDialog?: DialogAction;
  #context: BrowserContext;
  #onDialog = (dialog: Dialog) => this.#handleDialog(dialog);

  constructor(page: Page, options: WorldOptions) {
    this.#page = page;
    this.baseURL = options.baseURL;
    this.exactNames = options.exactNames;
    this.#context = page.context();
    // Without a listener Playwright dismisses dialogs silently; we record them and apply the
    // action from "I accept the next dialog" / "I dismiss the next dialog".
    this.#context.on('dialog', this.#onDialog);
  }

  /** The active browser tab. */
  get page(): Page {
    return this.#page;
  }

  /** Where elements are looked up: the active frame, or else the active tab. */
  get scope(): Scope {
    return this.#frame ?? this.#page;
  }

  /** The page definition whose aliases are in use, set by "I open the ... page". */
  get currentPage(): PageDefinition | undefined {
    return this.#currentPage;
  }

  usePage(name: string): PageDefinition {
    this.#currentPage = getPageDefinition(name);
    this.#frame = null;
    return this.#currentPage;
  }

  /** Stops using the aliases of the current page definition. */
  clearPage() {
    this.#currentPage = undefined;
    this.#frame = null;
  }

  switchToTab(page: Page) {
    this.#page = page;
    this.#frame = null;
  }

  switchToFrame(frame: FrameLocator | null) {
    this.#frame = frame;
  }

  /** Locator for an element named in a step, honouring aliases on the current page. */
  element(ref: ElementRef): Locator {
    return locate(this.scope, ref, {
      exact: this.exactNames,
      aliases: this.#currentPage?.elements,
    });
  }

  /**
   * Runs `action` on the element. When it fails because the element does not exist,
   * the error lists the elements of that type the page does offer.
   */
  async withElement<T>(ref: ElementRef, action: (element: Locator) => Promise<T>): Promise<T> {
    const element = this.element(ref);
    try {
      return await action(element);
    } catch (error) {
      await this.#explainMissing(error, ref, element);
      throw error;
    }
  }

  /** Resolves a URL relative to `baseURL` (or the current page when there is none). */
  url(path: string): string {
    const base =
      this.baseURL ?? (this.#page.url().startsWith('http') ? this.#page.url() : undefined);
    return base ? new URL(path, base).toString() : path;
  }

  setNextDialogAction(action: DialogAction) {
    this.#nextDialog = action;
  }

  dispose() {
    this.#context.off('dialog', this.#onDialog);
  }

  async #handleDialog(dialog: Dialog) {
    this.dialogs.push({ type: dialog.type(), message: dialog.message() });
    const action = this.#nextDialog;
    this.#nextDialog = undefined;
    try {
      if (action?.accept) await dialog.accept(action.promptText);
      else await dialog.dismiss();
    } catch {
      // The page may already be closed.
    }
  }

  async #explainMissing(error: unknown, ref: ElementRef, element: Locator) {
    if (!(error instanceof Error)) return;
    const count = await element.count().catch(() => -1);
    if (count !== 0) return;
    const snapshot = await this.scope
      .locator('body')
      .ariaSnapshot({ timeout: 2000 })
      .catch(() => '');
    const hint = describeMissing(ref, snapshot, this.#currentPage?.name);
    const original = error.message;
    error.message = `${hint}\n\n${original}`;
    if (error.stack?.includes(original)) error.stack = error.stack.replace(original, error.message);
  }
}
