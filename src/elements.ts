import type { FrameLocator, Locator, Page } from '@playwright/test';
import { parseAriaSnapshot } from './aria';

/**
 * Element types a step can name, e.g. `the "Log in" button`.
 * The type word decides how the element is looked up on the page.
 */
export const ELEMENT_TYPES = [
  'button',
  'link',
  'field',
  'checkbox',
  'radio button',
  'dropdown',
  'heading',
  'tab',
  'dialog',
  'menu item',
  'image',
  'section',
  'list',
  'element',
] as const;

export type ElementType = (typeof ELEMENT_TYPES)[number];

/** Where elements are looked up: the active page, or the active frame after "I switch to the ... frame". */
export type Scope = Page | FrameLocator;

/** A page-specific way to find an element: a selector string or a function returning a Locator. */
export type ElementAlias = string | ((scope: Scope) => Locator);

/** The value of an `{element}` parameter, e.g. `"Log in" button`. */
export class ElementRef {
  constructor(
    readonly name: string,
    readonly type: ElementType,
  ) {}

  toString() {
    return `"${this.name}" ${this.type}`;
  }
}

const typeAlternatives = [...ELEMENT_TYPES].sort((a, b) => b.length - a.length).join('|');

/** Matches `"<name>" <type>`; the name may contain escaped quotes (`\"`). */
export const ELEMENT_REGEXP = new RegExp(`"((?:[^"\\\\]|\\\\.)*)" (${typeAlternatives})`);

/** Like `{string}`, a backslash only escapes a quote: `"Say \"hi\"" button` → `Say "hi"`. */
export function toElementRef(name: string, type: string): ElementRef {
  return new ElementRef(unescapeQuotes(name), type as ElementType);
}

export function unescapeQuotes(text: string) {
  return text.replace(/\\(["'])/g, '$1');
}

/** Selector for elements that count as a text field (everything that takes typed input). */
const FIELD_SELECTOR = [
  'input:not([type=button],[type=submit],[type=reset],[type=checkbox],[type=radio],[type=image],[type=hidden],[type=range],[type=color])',
  'textarea',
  '[contenteditable=""]',
  '[contenteditable="true"]',
  '[role=textbox]',
  '[role=searchbox]',
  '[role=spinbutton]',
  '[role=combobox]',
].join(', ');

type AriaRole = Parameters<Page['getByRole']>[0];

type ElementTypeSpec = {
  /**
   * Roles that count as this type. The lookup finds an element with one of them, and the
   * "what this page offers" hint and `inspect` list their names from `ariaSnapshot()`.
   */
  roles: readonly AriaRole[];
  /** A lookup other than by role and accessible name. */
  locate?: (scope: Scope, name: string, exact: boolean) => Locator;
  plural: string;
  /** How the element is found, in words. Used by docs and the reviewer guide. */
  lookup: string;
};

const ELEMENT_TYPE_SPECS: Record<ElementType, ElementTypeSpec> = {
  button: {
    roles: ['button'],
    plural: 'Buttons',
    lookup: "a button with this name (`getByRole('button')`)",
  },
  link: {
    roles: ['link'],
    plural: 'Links',
    lookup: "a link with this text (`getByRole('link')`)",
  },
  field: {
    roles: ['textbox', 'searchbox', 'spinbutton'],
    locate: (scope, name, exact) =>
      scope
        .getByLabel(name, { exact })
        .or(scope.getByPlaceholder(name, { exact }))
        .and(scope.locator(FIELD_SELECTOR)),
    plural: 'Fields',
    lookup:
      'a text field with this label, or else this placeholder (`getByLabel`, `getByPlaceholder`)',
  },
  checkbox: {
    roles: ['checkbox'],
    plural: 'Checkboxes',
    lookup: "a checkbox with this label (`getByRole('checkbox')`)",
  },
  'radio button': {
    roles: ['radio'],
    plural: 'Radio buttons',
    lookup: "a radio button with this label (`getByRole('radio')`)",
  },
  dropdown: {
    roles: ['combobox', 'listbox'],
    plural: 'Dropdowns',
    lookup: "a dropdown (select box) with this label (`getByRole('combobox')`, `'listbox'`)",
  },
  heading: {
    roles: ['heading'],
    plural: 'Headings',
    lookup: "a heading with this text (`getByRole('heading')`)",
  },
  tab: {
    roles: ['tab'],
    plural: 'Tabs',
    lookup: "a tab with this name (`getByRole('tab')`)",
  },
  dialog: {
    roles: ['dialog', 'alertdialog'],
    plural: 'Dialogs',
    lookup: "a dialog or alert dialog with this title (`getByRole('dialog')`, `'alertdialog'`)",
  },
  'menu item': {
    roles: ['menuitem', 'menuitemcheckbox', 'menuitemradio'],
    plural: 'Menu items',
    lookup:
      "a menu item with this name, also one that can be ticked (`getByRole('menuitem')`, `'menuitemcheckbox'`, `'menuitemradio'`)",
  },
  image: {
    roles: ['img'],
    locate: (scope, name, exact) =>
      scope.getByAltText(name, { exact }).or(scope.getByRole('img', { name, exact })),
    plural: 'Images',
    lookup: "an image with this alternative text or name (`getByAltText`, `getByRole('img')`)",
  },
  section: {
    roles: ['region'],
    plural: 'Sections',
    lookup: "a section (landmark region) with this name (`getByRole('region')`)",
  },
  list: {
    roles: ['list'],
    plural: 'Lists',
    lookup: "a list with this name (`getByRole('list')`)",
  },
  element: {
    roles: [],
    locate: (scope, name, exact) => scope.getByText(name, { exact }),
    plural: 'Elements',
    lookup: 'any element showing exactly this text (`getByText`); mostly used with aliases',
  },
};

/** The element type a role from `ariaSnapshot()` belongs to, e.g. `textbox` → `field`. */
export function elementTypeOfRole(role: string): ElementType | undefined {
  return ELEMENT_TYPES.find((type) =>
    (ELEMENT_TYPE_SPECS[type].roles as readonly string[]).includes(role),
  );
}

export const PLURAL = mapTypes((spec) => spec.plural);

/** How each element type is found, in words. Used by docs and the reviewer guide. */
export const LOOKUP_DESCRIPTION = mapTypes((spec) => spec.lookup);

function mapTypes<T>(fn: (spec: ElementTypeSpec) => T): Record<ElementType, T> {
  return Object.fromEntries(
    ELEMENT_TYPES.map((type) => [type, fn(ELEMENT_TYPE_SPECS[type])]),
  ) as Record<ElementType, T>;
}

export type LocateOptions = {
  exact: boolean;
  aliases?: Readonly<Record<string, ElementAlias>>;
};

/**
 * Builds the Locator for an element reference.
 * Order: alias on the current page → lookup by role, label or text.
 * Alias keys are the name as written in the step (`'"Settings" button'`), or just the name
 * (`'Settings'`) to cover every element type.
 */
export function locate(scope: Scope, ref: ElementRef, options: LocateOptions): Locator {
  const alias = findAlias(options.aliases, ref);
  if (alias !== undefined) return typeof alias === 'string' ? scope.locator(alias) : alias(scope);
  return locateByType(scope, ref, options.exact);
}

export function findAlias(
  aliases: Readonly<Record<string, ElementAlias>> | undefined,
  ref: ElementRef,
): ElementAlias | undefined {
  if (!aliases) return undefined;
  return aliases[String(ref)] ?? aliases[ref.name];
}

export function locateByType(scope: Scope, ref: ElementRef, exact: boolean): Locator {
  const { name, type } = ref;
  const spec = ELEMENT_TYPE_SPECS[type];
  if (spec.locate) return spec.locate(scope, name, exact);
  return spec.roles
    .map((role) => scope.getByRole(role, { name, exact }))
    .reduce((found, other) => found.or(other));
}

/**
 * Explains a missing element by listing what the page offers, built from `ariaSnapshot()`.
 * Example: `No "Log in" button found. Buttons on this page: "Sign in", "Forgot password?"`.
 */
export function describeMissing(ref: ElementRef, snapshot: string, pageName?: string): string {
  const where = pageName ? ` on the "${pageName}" page` : '';
  const lines = [`No ${ref} found${where}.`];
  const roles: readonly string[] = ELEMENT_TYPE_SPECS[ref.type].roles;
  if (roles.length) {
    const names = [
      ...new Set(
        parseAriaSnapshot(snapshot)
          .filter((node) => roles.includes(node.role) && node.name)
          .map((node) => `"${node.name}"`),
      ),
    ];
    const shown = names.length > 15 ? [...names.slice(0, 15), '…'] : names;
    lines.push(`${PLURAL[ref.type]} on this page: ${shown.length ? shown.join(', ') : '(none)'}.`);
  }
  lines.push(
    pageName
      ? `If the element has no visible name, add an alias: definePage('${pageName}', { elements: { '${ref.name}': '<selector>' } }).`
      : 'If the element has no visible name, define the page with definePage() and add an alias.',
  );
  return lines.join('\n');
}
