import type {
  BrowserContext,
  Dialog,
  Download,
  FrameLocator,
  Locator,
  Page,
} from '@playwright/test';
import { test } from '@playwright/test';
import { describeMissing, ElementRef, locate, Scope } from './elements';
import { getPageDefinition, getPageSource, PageDefinition } from './pages';
import { remember } from './values';

export type WorldOptions = {
  baseURL?: string;
  /** Match element names exactly (default) or as case-insensitive substrings. */
  exactNames: boolean;
};

export type DialogRecord = { type: string; message: string };

/** The answer to the last request a step sent: the body as JSON, or as text if it is none. */
export type ApiResponse = { method: string; url: string; status: number; body: unknown };

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
  /** The answer to the last request sent by a step, e.g. I send a "GET" request to "...". */
  response?: ApiResponse;

  #page: Page;
  #frame: FrameLocator | null = null;
  #currentPage?: PageDefinition;
  #nextDialog?: DialogAction;
  #context: BrowserContext;
  #onDialog = (dialog: Dialog) => this.#handleDialog(dialog);
  #afterTest: { title: string; action: () => Promise<void> }[] = [];

  constructor(page: Page, options: WorldOptions) {
    this.#page = page;
    this.baseURL = options.baseURL;
    this.exactNames = options.exactNames;
    this.#context = page.context();
    // We record every dialog and apply the action from "I accept the next dialog" /
    // "I dismiss the next dialog". Unannounced dialogs are answered the way Playwright does.
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

  /** The address the active tab shows, without the base URL: `/dashboard`. */
  address(): string {
    const url = this.#page.url();
    try {
      if (this.baseURL && new URL(url).origin === new URL(this.baseURL).origin) {
        const { pathname, search, hash } = new URL(url);
        return `${pathname}${search}${hash}`;
      }
    } catch {
      // Not an address with an origin, such as about:blank.
    }
    return url;
  }

  setNextDialogAction(action: DialogAction) {
    this.#nextDialog = action;
  }

  /** Keeps a value for the rest of the test, so later steps can write `{name}` in quotes. */
  remember(name: string, value: unknown) {
    remember(name, value);
  }

  /**
   * Sends a request with the browser's cookies, so it is logged in when the browser is.
   * Addresses are relative to `baseURL`. An object or JSON text is sent as JSON. The answer is
   * kept in `response` and remembered as `{response}`.
   */
  async request(method: string, url: string, body?: unknown): Promise<ApiResponse> {
    const response = await this.#page.request.fetch(url, {
      method: method.toUpperCase(),
      ...(body === undefined ? {} : { data: asRequestBody(body) }),
      failOnStatusCode: false,
    });
    const text = await response.text();
    let parsed: unknown = text;
    try {
      parsed = text ? JSON.parse(text) : text;
    } catch {
      // Not JSON: keep the text.
    }
    this.response = { method: method.toUpperCase(), url, status: response.status(), body: parsed };
    remember('response', parsed);
    return this.response;
  }

  /** Runs `action` after the test, also when it failed. The last one added runs first. */
  afterTest(title: string, action: () => Promise<void>) {
    this.#afterTest.unshift({ title, action });
  }

  /** Runs the actions added with afterTest(). Called by the `world` fixture. */
  async runAfterTest() {
    const errors: unknown[] = [];
    for (const { title, action } of this.#afterTest.splice(0)) {
      await test.step(title, action).catch((error) => errors.push(error));
    }
    if (errors.length === 1) throw errors[0];
    if (errors.length) {
      throw new Error(
        `[plainwright] ${errors.length} steps after the test failed:\n` +
          errors.map((e) => (e instanceof Error ? e.message : String(e))).join('\n'),
      );
    }
  }

  dispose() {
    this.#context.off('dialog', this.#onDialog);
  }

  async #handleDialog(dialog: Dialog) {
    this.dialogs.push({ type: dialog.type(), message: dialog.message() });
    const action = this.#nextDialog;
    // Context listeners run before page listeners. A project step that listens on the page
    // answers unannounced dialogs itself.
    if (!action && hasDialogListener(dialog.page())) return;
    this.#nextDialog = undefined;
    // Like Playwright without a listener: leave the page ("Leave site?"), dismiss the rest.
    const accept = action ? action.accept : dialog.type() === 'beforeunload';
    try {
      if (accept) await dialog.accept(action?.promptText);
      else await dialog.dismiss();
    } catch {
      // The page may already be closed.
    }
  }

  async #explainMissing(error: unknown, ref: ElementRef, element: Locator) {
    if (!(error instanceof Error)) return;
    const count = await element.count().catch(() => -1);
    if (count !== 0) return;
    // Explain the outermost part that is missing: the row before the button in it.
    let missing = ref;
    for (let container = ref.container; container; container = container.container) {
      if (
        (await this.element(container)
          .count()
          .catch(() => -1)) === 0
      )
        missing = container;
    }
    const where = missing.container
      ? this.element(missing.container).first()
      : this.scope.locator('body');
    const snapshot = await where.ariaSnapshot({ timeout: 2000 }).catch(() => '');
    const page = this.#currentPage?.name;
    addHint(
      error,
      describeMissing(missing, snapshot, {
        page,
        pageFile: page && getPageSource(page),
        address: this.address(),
      }),
    );
  }
}

/**
 * Puts an explanation in front of the error message, also in the stack Playwright prints.
 * Playwright's own message follows as details for developers.
 */
export function addHint(error: Error, hint: string) {
  const original = error.message;
  error.message = `${hint}\n\nDetails for developers:\n${original}`;
  if (error.stack?.includes(original)) error.stack = error.stack.replace(original, error.message);
}

/** Whether the page has its own `dialog` listener. Pages are Node event emitters at runtime. */
function hasDialogListener(page: Page | null): boolean {
  const emitter = page as { listenerCount?: (event: string) => number } | null;
  return (emitter?.listenerCount?.('dialog') ?? 0) > 0;
}

/** Objects as JSON; text with a JSON object or list as JSON too, so a doc string works. */
function asRequestBody(body: unknown) {
  if (typeof body !== 'string') return body;
  try {
    const parsed: unknown = JSON.parse(body);
    return typeof parsed === 'object' && parsed !== null ? parsed : body;
  } catch {
    return body;
  }
}
