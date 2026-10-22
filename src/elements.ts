import type { FrameLocator, Locator, Page } from '@playwright/test';
import { AriaNode, parseAriaSnapshot } from './aria';
import { closest } from './similar';

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
  'switch',
  'dropdown',
  'option',
  'heading',
  'tab',
  'dialog',
  'menu item',
  'image',
  'section',
  'list',
  'list item',
  'row',
  'cell',
  'message',
  'element',
] as const;

export type ElementType = (typeof ELEMENT_TYPES)[number];

/**
 * Where elements are looked up: the active page, the active frame after "I switch to the ...
 * frame", or the element another one is named in (`the "Delete" button in the "Order 1" row`).
 */
export type Scope = Page | FrameLocator | Locator;

/** A page-specific way to find an element: a selector string or a function returning a Locator. */
export type ElementAlias = string | ((scope: Scope) => Locator);

/**
 * The value of an `{element}` parameter, e.g. `"Log in" button`, or
 * `"Delete" button in the "Order 1001" row` with the row as container.
 */
export class ElementRef {
  constructor(
    readonly name: string,
    readonly type: ElementType,
    /** The element this one is looked up in. */
    readonly container?: ElementRef,
  ) {}

  /** Name and type without the container: `"Delete" button`. */
  get label() {
    return `"${this.name}" ${this.type}`;
  }

  toString(): string {
    return this.container ? `${this.label} in the ${this.container}` : this.label;
  }
}

const TYPES = [...ELEMENT_TYPES].sort((a, b) => b.length - a.length).join('|');
/** A name in quotes may contain escaped quotes (`\"`). */
const NAME = '(?:[^"\\\\]|\\\\.)*';
const ONE_ELEMENT = new RegExp(`"(${NAME})" (${TYPES})`, 'g');

/**
 * Matches `"<name>" <type>`, optionally followed by `in the "<name>" <type>` for the element it
 * is in, repeatable.
 */
export const ELEMENT_REGEXP = new RegExp(
  `"${NAME}" (?:${TYPES})(?: in the "${NAME}" (?:${TYPES}))*`,
);

/**
 * `"Delete" button in the "Order 1001" row` → ElementRef with the row as container.
 * Like `{string}`, a backslash only escapes a quote: `"Say \"hi\"" button` → `Say "hi"`.
 */
export function toElementRef(text: string): ElementRef {
  const parts = [...text.matchAll(ONE_ELEMENT)].map(
    ([, name, type]) => [unescapeQuotes(name), type as ElementType] as const,
  );
  return parts.reduceRight<ElementRef | undefined>(
    (container, [name, type]) => new ElementRef(name, type, container),
    undefined,
  )!;
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
  /** What the hint and `inspect` show for a node of this type. Default: its accessible name. */
  label?: (node: AriaNode) => string;
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
      'a text field with this label, or else this placeholder, the grey hint inside it (`getByLabel`, `getByPlaceholder`)',
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
  switch: {
    roles: ['switch'],
    plural: 'Switches',
    lookup: "a switch that turns something on or off, with this label (`getByRole('switch')`)",
  },
  dropdown: {
    roles: ['combobox', 'listbox'],
    plural: 'Dropdowns',
    lookup: "a dropdown (select box) with this label (`getByRole('combobox')`, `'listbox'`)",
  },
  // Custom dropdowns and search suggestions often show their options elsewhere on the page (a
  // portal), outside the dropdown, so an option is looked up on the whole page.
  option: {
    roles: ['option'],
    plural: 'Options',
    lookup:
      "an option to choose in an open list, such as a custom dropdown or search suggestions, with this text (`getByRole('option')`)",
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
    lookup: "an area of the page (landmark region) with this name (`getByRole('region')`)",
  },
  list: {
    roles: ['list'],
    plural: 'Lists',
    lookup: "a list with this name (`getByRole('list')`)",
  },
  // A list item's, row's or message's accessible name is not what the user sees (a row's name
  // is the text of all its cells). These types match by the text they contain.
  'list item': {
    roles: ['listitem'],
    locate: (scope, name, exact) => containing(scope.getByRole('listitem'), name, exact),
    label: firstText,
    plural: 'List items',
    lookup: "a list item that contains this text (`getByRole('listitem')`)",
  },
  row: {
    roles: ['row'],
    locate: (scope, name, exact) => containing(scope.getByRole('row'), name, exact),
    label: (node) =>
      node.descendants.find((d) => CELL_ROLES.includes(d.role) && d.name)?.name ?? '',
    plural: 'Rows',
    lookup: "a table row that contains this text, e.g. in its first cell (`getByRole('row')`)",
  },
  cell: {
    roles: ['cell', 'gridcell'],
    plural: 'Cells',
    lookup: "a table cell with this text (`getByRole('cell')`, `'gridcell'`)",
  },
  message: {
    roles: ['alert', 'status'],
    locate: (scope, name, exact) =>
      containing(scope.getByRole('alert').or(scope.getByRole('status')), name, exact),
    label: firstText,
    plural: 'Messages',
    lookup:
      "a notice, such as a toast or an error banner, that contains this text (`getByRole('alert')`, `'status'`)",
  },
  element: {
    roles: [],
    locate: (scope, name, exact) => scope.getByText(name, { exact }),
    plural: 'Elements',
    lookup:
      'any element showing exactly this text; mostly for names your team defined, called aliases (`getByText`)',
  },
};

/**
 * The nodes of a snapshot without the options of a select box (`combobox`): no click reaches
 * them, `I select` chooses them.
 */
export function clickableNodes(nodes: AriaNode[]): AriaNode[] {
  const inSelect = new Set(
    nodes
      .filter((node) => node.role === 'combobox')
      .flatMap((node) => node.descendants.filter((d) => d.role === 'option')),
  );
  return nodes.filter((node) => !inSelect.has(node));
}

/** The element type a role from `ariaSnapshot()` belongs to, e.g. `textbox` → `field`. */
export function elementTypeOfRole(role: string): ElementType | undefined {
  return ELEMENT_TYPES.find((type) =>
    (ELEMENT_TYPE_SPECS[type].roles as readonly string[]).includes(role),
  );
}

/** What the hint and `inspect` show for a node of a role, e.g. the first cell of a row. */
export function labelOf(type: ElementType, node: AriaNode): string {
  return ELEMENT_TYPE_SPECS[type].label?.(node) ?? node.name;
}

export const PLURAL = mapTypes((spec) => spec.plural);

/** How each element type is found, in words. Used by docs and the reviewer guide. */
export const LOOKUP_DESCRIPTION = mapTypes((spec) => spec.lookup);

const CELL_ROLES = ['cell', 'gridcell', 'columnheader', 'rowheader'];

/**
 * Elements that contain the text: with the same capitals when `exact`, else ignoring them.
 * Spaces match any whitespace or none, because the text of table cells may run together.
 */
function containing(elements: Locator, text: string, exact: boolean): Locator {
  const words = text.trim().split(/\s+/).map(escapeRegExp);
  return elements.filter({ hasText: new RegExp(words.join('\\s*'), exact ? '' : 'i') });
}

/** The first text in the node, e.g. `Buy milk` for a list item with a checkbox and a label. */
function firstText(node: AriaNode): string {
  return node.text || node.descendants.find((d) => d.text)?.text || '';
}

export function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

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
 * Builds the Locator for an element reference, inside its container if it names one.
 * Order: alias on the current page → lookup by role, label or text.
 * Alias keys are the name as written in the step (`'"Settings" button'`), or just the name
 * (`'Settings'`) to cover every element type. Containers are looked up the same way.
 */
export function locate(scope: Scope, ref: ElementRef, options: LocateOptions): Locator {
  const within = ref.container ? locate(scope, ref.container, options) : scope;
  const alias = findAlias(options.aliases, ref);
  if (alias !== undefined) return typeof alias === 'string' ? within.locator(alias) : alias(within);
  return locateByType(within, ref, options.exact);
}

export function findAlias(
  aliases: Readonly<Record<string, ElementAlias>> | undefined,
  ref: Pick<ElementRef, 'name' | 'label'>,
): ElementAlias | undefined {
  return ownEntry(aliases, ref.label) ?? ownEntry(aliases, ref.name);
}

/** `record[key]`, but never a member of `Object.prototype` such as `constructor`. */
export function ownEntry<T>(record: Readonly<Record<string, T>> | undefined, key: string) {
  return record && Object.hasOwn(record, key) ? record[key] : undefined;
}

export function locateByType(scope: Scope, ref: ElementRef, exact: boolean): Locator {
  const { name, type } = ref;
  const spec = ELEMENT_TYPE_SPECS[type];
  if (spec.locate) return spec.locate(scope, name, exact);
  return spec.roles
    .map((role) => scope.getByRole(role, { name, exact }))
    .reduce((found, other) => found.or(other));
}

export type MissingContext = {
  /** The page whose aliases are in use, and its file in pages/. */
  page?: string;
  pageFile?: string;
  /** The address the browser shows, e.g. `/dashboard`. */
  address?: string;
};

/**
 * Explains a missing element by listing what the page offers, built from `ariaSnapshot()` of
 * the page, or of the container the element is named in.
 * Example: `No "Log in" button found. Buttons on this page: "Sign in", "Forgot password?"`.
 */
export function describeMissing(
  ref: ElementRef,
  snapshot: string,
  { page: pageName, pageFile, address }: MissingContext = {},
): string {
  const where = ref.container
    ? ` in the ${ref.container}`
    : pageName
      ? ` on the "${pageName}" page`
      : '';
  const lines = [`No ${ref.label} found${where}.`];
  const roles: readonly string[] = ELEMENT_TYPE_SPECS[ref.type].roles;
  const nodes = clickableNodes(parseAriaSnapshot(snapshot)).filter((node) =>
    roles.includes(node.role),
  );
  const names = [...new Set(nodes.map((node) => labelOf(ref.type, node)).filter(Boolean))];
  if (roles.length) {
    const quoted = names.map((name) => `"${name}"`);
    const shown = quoted.length > 15 ? [...quoted.slice(0, 15), '…'] : quoted;
    const offered = ref.container ? `in the ${ref.container}` : 'on this page';
    lines.push(`${PLURAL[ref.type]} ${offered}: ${shown.length ? sentence(shown) : '(none).'}`);
  }
  // A wrong page, or one that sent the browser elsewhere, shows in the address.
  if (address) lines.push(`The address in the browser is ${address}.`);
  // A typo is more likely than an element without a name.
  const meant = closest(ref.name, names);
  if (meant) {
    lines.push(`Did you mean "${meant}"?`);
    return lines.join('\n');
  }
  // With no element of the type at all, an alias would not help.
  if (roles.length && !nodes.length) return lines.join('\n');
  const alias = `"elements": { ${JSON.stringify(ref.name)}: "<selector>" }`;
  lines.push(
    pageFile
      ? `If the element has no visible name, add an alias to ${pageFile}: ${alias}.`
      : pageName
        ? `If the element has no visible name, add an alias: definePage('${pageName}', { elements: { '${ref.name}': '<selector>' } }).`
        : `If the element has no visible name, add an alias in the page's file in pages/, ${alias}, and open the page by name: I open the "…" page.`,
  );
  return lines.join('\n');
}

/**
 * Explains a text check that failed with the texts on the page that look like the one expected,
 * from `ariaSnapshot()` of the page.
 * Example: `The text "Email or password is wrong." is not visible on the page.
 * Similar texts on this page: "Username and password are incorrect."`.
 */
export function describeMissingText(text: string, snapshot: string, address?: string): string {
  const lines = [`The text "${text}" is not visible on the page.`];
  const texts = new Set<string>();
  for (const node of parseAriaSnapshot(snapshot)) {
    for (const { name, text } of [node, ...node.descendants]) {
      for (const value of [name, text]) if (value && value.length <= 200) texts.add(value);
    }
  }
  const lower = text.toLowerCase();
  const otherCapitals = [...texts].filter(
    (t) => t.toLowerCase().includes(lower) && !t.includes(text),
  );
  const words = wordsOf(text);
  const similar = [...texts]
    .map((candidate) => {
      const shared = new Set(wordsOf(candidate).filter((word) => words.includes(word))).size;
      return { candidate, shared, score: words.length ? shared / words.length : 0 };
    })
    // Half the words, and two of them unless the text is one word: "Order saved" is not
    // similar to "Order 1001".
    .filter(({ shared, score }) => score >= 0.5 && (shared >= 2 || words.length === 1))
    .sort((a, b) => b.score - a.score)
    .map(({ candidate }) => candidate);
  const meant = closest(text, [...texts]);
  const shown = [...new Set([...otherCapitals, ...(meant ? [meant] : []), ...similar])].slice(0, 5);
  if (shown.length) {
    lines.push(`Similar texts on this page: ${sentence(shown.map((t) => `"${t}"`))}`);
  }
  if (otherCapitals.length) lines.push('Text checks compare capitals too.');
  if (address) lines.push(`The address in the browser is ${address}.`);
  return lines.join('\n');
}

/** The quoted items as the end of a sentence: no second full stop after `"Saved."`. */
function sentence(quoted: string[]): string {
  const text = quoted.join(', ');
  return /[.!?…]"?$/.test(text) ? text : `${text}.`;
}

/** Words of three letters or more, in lower case: `Buy milk!` → `['buy', 'milk']`. */
function wordsOf(text: string): string[] {
  return (text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []).filter((word) => word.length >= 3);
}
