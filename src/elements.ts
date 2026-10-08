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

export function toElementRef(name: string, type: string): ElementRef {
  return new ElementRef(name.replace(/\\(.)/g, '$1'), type as ElementType);
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

const ROLE_BY_TYPE: Partial<Record<ElementType, AriaRole>> = {
  button: 'button',
  link: 'link',
  checkbox: 'checkbox',
  'radio button': 'radio',
  heading: 'heading',
  tab: 'tab',
  dialog: 'dialog',
  'menu item': 'menuitem',
  section: 'region',
  list: 'list',
};

/** Roles shown in the "what this page offers" hint, per element type. */
const SNAPSHOT_ROLES: Record<ElementType, string[]> = {
  button: ['button'],
  link: ['link'],
  field: ['textbox', 'searchbox', 'spinbutton'],
  checkbox: ['checkbox'],
  'radio button': ['radio'],
  dropdown: ['combobox', 'listbox'],
  heading: ['heading'],
  tab: ['tab'],
  dialog: ['dialog', 'alertdialog'],
  'menu item': ['menuitem', 'menuitemcheckbox', 'menuitemradio'],
  image: ['img'],
  section: ['region'],
  list: ['list'],
  element: [],
};

/** The element type a role from `ariaSnapshot()` belongs to, e.g. `textbox` → `field`. */
export function elementTypeOfRole(role: string): ElementType | undefined {
  return ELEMENT_TYPES.find((type) => SNAPSHOT_ROLES[type].includes(role));
}

export const PLURAL: Record<ElementType, string> = {
  button: 'Buttons',
  link: 'Links',
  field: 'Fields',
  checkbox: 'Checkboxes',
  'radio button': 'Radio buttons',
  dropdown: 'Dropdowns',
  heading: 'Headings',
  tab: 'Tabs',
  dialog: 'Dialogs',
  'menu item': 'Menu items',
  image: 'Images',
  section: 'Sections',
  list: 'Lists',
  element: 'Elements',
};

/** How each element type is found, in words. Used by docs and the reviewer guide. */
export const LOOKUP_DESCRIPTION: Record<ElementType, string> = {
  button: "a button with this name (`getByRole('button')`)",
  link: "a link with this text (`getByRole('link')`)",
  field:
    'a text field with this label, or else this placeholder (`getByLabel`, `getByPlaceholder`)',
  checkbox: "a checkbox with this label (`getByRole('checkbox')`)",
  'radio button': "a radio button with this label (`getByRole('radio')`)",
  dropdown: "a dropdown (select box) with this label (`getByRole('combobox')`)",
  heading: "a heading with this text (`getByRole('heading')`)",
  tab: "a tab with this name (`getByRole('tab')`)",
  dialog: "a dialog with this title (`getByRole('dialog')`)",
  'menu item': "a menu item with this name (`getByRole('menuitem')`)",
  image: 'an image with this alternative text (`getByAltText`)',
  section: "a section (landmark region) with this name (`getByRole('region')`)",
  list: "a list with this name (`getByRole('list')`)",
  element: 'any element showing exactly this text (`getByText`); mostly used with aliases',
};

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
  const role = ROLE_BY_TYPE[type];
  if (role) return scope.getByRole(role, { name, exact });
  switch (type) {
    case 'field':
      return scope
        .getByLabel(name, { exact })
        .or(scope.getByPlaceholder(name, { exact }))
        .and(scope.locator(FIELD_SELECTOR));
    case 'dropdown':
      return scope
        .getByRole('combobox', { name, exact })
        .or(scope.getByRole('listbox', { name, exact }));
    case 'image':
      return scope.getByAltText(name, { exact });
    default:
      return scope.getByText(name, { exact });
  }
}

/**
 * Explains a missing element by listing what the page offers, built from `ariaSnapshot()`.
 * Example: `No "Log in" button found. Buttons on this page: "Sign in", "Forgot password?"`.
 */
export function describeMissing(ref: ElementRef, snapshot: string, pageName?: string): string {
  const where = pageName ? ` on the "${pageName}" page` : '';
  const lines = [`No ${ref} found${where}.`];
  const roles = SNAPSHOT_ROLES[ref.type];
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
