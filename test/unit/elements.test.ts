import { describe, expect, it } from 'vitest';
import { parseAriaSnapshot } from '../../src/aria';
import {
  describeMissing,
  describeMissingText,
  ElementRef,
  locate,
  Scope,
} from '../../src/elements';
import { findStep } from '../../src/index';
import { formatInspectResult, groupSnapshot } from '../../src/inspect';

/** A stand-in for Page/FrameLocator/Locator that records how a locator was built. */
function fakeScope(): Scope {
  const show = (value: unknown): string =>
    value instanceof RegExp
      ? String(value)
      : typeof value === 'object' && value
        ? `{${Object.entries(value)
            .map(([k, v]): string => `"${k}":${show(v)}`)
            .join(',')}}`
        : JSON.stringify(value);
  const methods = (prefix: string): Record<string, unknown> =>
    Object.fromEntries(
      ['getByRole', 'getByLabel', 'getByPlaceholder', 'getByAltText', 'getByText', 'locator'].map(
        (name) => [
          name,
          (...args: unknown[]) => node(`${prefix}${name}(${args.map(show).join(', ')})`),
        ],
      ),
    );
  const node = (description: string): unknown => ({
    description,
    ...methods(`${description}.`),
    or: (other: { description: string }) => node(`${description}.or(${other.description})`),
    and: (other: { description: string }) => node(`${description}.and(${other.description})`),
    filter: (options: unknown) => node(`${description}.filter(${show(options)})`),
  });
  return methods('') as unknown as Scope;
}

const describeLocator = (ref: ElementRef, options: Parameters<typeof locate>[2]) =>
  (locate(fakeScope(), ref, options) as unknown as { description: string }).description;

describe('{element} parameter', () => {
  it.each([
    ['I click the "Log in" button', 'Log in', 'button'],
    ['I click the "Yes" radio button', 'Yes', 'radio button'],
    ['I click the "Save as" menu item', 'Save as', 'menu item'],
    ['I click the "Say \\"hi\\"" button', 'Say "hi"', 'button'],
    ['I click the "C:\\temp" button', 'C:\\temp', 'button'],
  ])('%s', (text, name, type) => {
    const element = findStep(text).args[0] as ElementRef;
    expect(element).toBeInstanceOf(ElementRef);
    expect(element).toMatchObject({ name, type });
  });

  it('names the element it is in', () => {
    const element = findStep('I click the "Delete" button in the "Order 1001" row')
      .args[0] as ElementRef;
    expect(element).toMatchObject({ name: 'Delete', type: 'button' });
    expect(element.container).toMatchObject({ name: 'Order 1001', type: 'row' });
    expect(String(element)).toBe('"Delete" button in the "Order 1001" row');
  });

  it('nests several levels and keeps escaped quotes', () => {
    const element = findStep(
      'I see the "Say \\"in the\\" row" link in the "Notes" cell in the "Orders" section',
    ).args[0] as ElementRef;
    expect(element.name).toBe('Say "in the" row');
    expect(element.container?.container).toMatchObject({ name: 'Orders', type: 'section' });
  });

  it.each([
    [
      'I fill "Jane" in the "Name" field in the "Billing" section',
      ['Jane', '"Name" field in the "Billing" section'],
    ],
    ['I see the text "Total" in the "Order 1001" row', ['Total', '"Order 1001" row']],
    ['I press "Enter" in the "Search" field', ['Enter', '"Search" field']],
  ])('keeps "in the" of the step apart: %s', (text, args) => {
    expect(findStep(text).args.map(String)).toEqual(args);
  });

  it('rejects unknown element types', () => {
    expect(() => findStep('I click the "Log in" gizmo')).toThrow(/No step matches/);
  });
});

describe('locate', () => {
  const exact = { exact: true };

  it.each([
    ['button', `getByRole("button", {"name":"X","exact":true})`],
    ['link', `getByRole("link", {"name":"X","exact":true})`],
    ['checkbox', `getByRole("checkbox", {"name":"X","exact":true})`],
    ['radio button', `getByRole("radio", {"name":"X","exact":true})`],
    ['heading', `getByRole("heading", {"name":"X","exact":true})`],
    ['tab', `getByRole("tab", {"name":"X","exact":true})`],
    [
      'dialog',
      `getByRole("dialog", {"name":"X","exact":true}).or(getByRole("alertdialog", {"name":"X","exact":true}))`,
    ],
    [
      'menu item',
      `getByRole("menuitem", {"name":"X","exact":true}).or(getByRole("menuitemcheckbox", {"name":"X","exact":true})).or(getByRole("menuitemradio", {"name":"X","exact":true}))`,
    ],
    ['section', `getByRole("region", {"name":"X","exact":true})`],
    ['list', `getByRole("list", {"name":"X","exact":true})`],
    [
      'cell',
      `getByRole("cell", {"name":"X","exact":true}).or(getByRole("gridcell", {"name":"X","exact":true}))`,
    ],
    ['image', `getByAltText("X", {"exact":true}).or(getByRole("img", {"name":"X","exact":true}))`],
    ['element', `getByText("X", {"exact":true})`],
  ] as const)('finds a %s by %s', (type, expected) => {
    expect(describeLocator(new ElementRef('X', type), exact)).toBe(expected);
  });

  it('finds a field by label, or else placeholder, among text inputs', () => {
    expect(describeLocator(new ElementRef('Email', 'field'), exact)).toMatch(
      /^getByLabel\("Email", \{"exact":true\}\)\.or\(getByPlaceholder\("Email", \{"exact":true\}\)\)\.and\(locator\("input:not/,
    );
  });

  it('finds a dropdown as combobox or listbox', () => {
    expect(describeLocator(new ElementRef('Country', 'dropdown'), exact)).toBe(
      `getByRole("combobox", {"name":"Country","exact":true}).or(getByRole("listbox", {"name":"Country","exact":true}))`,
    );
  });

  it('can match names as substrings', () => {
    expect(describeLocator(new ElementRef('Log', 'button'), { exact: false })).toBe(
      `getByRole("button", {"name":"Log","exact":false})`,
    );
  });

  it('prefers an alias of the current page', () => {
    const aliases = { Search: '[data-testid="search"]' };
    expect(describeLocator(new ElementRef('Search', 'field'), { ...exact, aliases })).toBe(
      'locator("[data-testid=\\"search\\"]")',
    );
  });

  it('prefers an alias with element type over one with only the name', () => {
    const aliases = { Settings: '#any', '"Settings" button': '#button' };
    expect(describeLocator(new ElementRef('Settings', 'button'), { ...exact, aliases })).toBe(
      'locator("#button")',
    );
    expect(describeLocator(new ElementRef('Settings', 'dialog'), { ...exact, aliases })).toBe(
      'locator("#any")',
    );
  });

  it('looks an element up inside the element it is named in', () => {
    const ref = new ElementRef('Delete', 'button', new ElementRef('Order 1001', 'row'));
    expect(describeLocator(ref, exact)).toBe(
      `getByRole("row").filter({"hasText":/Order\\s*1001/}).getByRole("button", {"name":"Delete","exact":true})`,
    );
  });

  it('uses aliases for containers too', () => {
    const ref = new ElementRef('Delete', 'button', new ElementRef('Orders', 'section'));
    const aliases = { Orders: '#orders', '"Delete" button': '.delete' };
    expect(describeLocator(ref, { ...exact, aliases })).toBe(
      'locator("#orders").locator(".delete")',
    );
  });

  it.each([
    ['row', 'getByRole("row")'],
    ['list item', 'getByRole("listitem")'],
    ['message', 'getByRole("alert").or(getByRole("status"))'],
  ] as const)('finds a %s by the text it contains', (type, elements) => {
    expect(describeLocator(new ElementRef('Buy milk', type), exact)).toBe(
      `${elements}.filter({"hasText":/Buy\\s*milk/})`,
    );
    expect(describeLocator(new ElementRef('Buy milk', type), { exact: false })).toBe(
      `${elements}.filter({"hasText":/Buy\\s*milk/i})`,
    );
  });

  it('only uses aliases the page defines, not Object members', () => {
    expect(
      describeLocator(new ElementRef('constructor', 'button'), { ...exact, aliases: {} }),
    ).toBe(`getByRole("button", {"name":"constructor","exact":true})`);
  });

  it('calls alias functions with the scope', () => {
    const aliases = { Delete: (scope: Scope) => scope.getByText('row 1') };
    expect(describeLocator(new ElementRef('Delete', 'button'), { ...exact, aliases })).toBe(
      'getByText("row 1")',
    );
  });
});

const snapshot = `
- dialog "Cookie consent":
  - paragraph: We use cookies.
  - button "Accept Cookies"
- main:
  - heading "Log in" [level=1]
  - textbox "Username"
  - textbox
  - button "Log in" [disabled]
  - button
  - link "Forgot \\"my\\" password?":
    - /url: "#"
`;

describe('aria snapshot', () => {
  it('extracts roles and names', () => {
    expect(parseAriaSnapshot(snapshot).map(({ role, name }) => ({ role, name }))).toEqual([
      { role: 'dialog', name: 'Cookie consent' },
      { role: 'paragraph', name: '' },
      { role: 'button', name: 'Accept Cookies' },
      { role: 'main', name: '' },
      { role: 'heading', name: 'Log in' },
      { role: 'textbox', name: 'Username' },
      { role: 'textbox', name: '' },
      { role: 'button', name: 'Log in' },
      { role: 'button', name: '' },
      { role: 'link', name: 'Forgot "my" password?' },
    ]);
  });

  it('explains a missing element with the names the page offers', () => {
    expect(describeMissing(new ElementRef('Sign up', 'button'), snapshot, 'Login')).toBe(
      [
        'No "Sign up" button found on the "Login" page.',
        'Buttons on this page: "Accept Cookies", "Log in".',
        `If the element has no visible name, add an alias: definePage('Login', { elements: { 'Sign up': '<selector>' } }).`,
      ].join('\n'),
    );
  });

  it('points to the file of the page for an alias', () => {
    expect(
      describeMissing(new ElementRef('Sign up', 'button'), snapshot, 'Login', 'pages/login.json'),
    ).toContain(
      'If the element has no visible name, add an alias to pages/login.json: "elements": { "Sign up": "<selector>" }.',
    );
  });

  it('points to the pages folder when no page is open', () => {
    expect(describeMissing(new ElementRef('Sign up', 'button'), snapshot)).toContain(
      `add an alias in the page's file in pages/, "elements": { "Sign up": "<selector>" }, and open the page by name`,
    );
  });

  it('says when the page has no element of that type', () => {
    expect(describeMissing(new ElementRef('Agree', 'checkbox'), snapshot)).toContain(
      'Checkboxes on this page: (none).',
    );
  });

  it('lists every role the lookup finds', () => {
    const widgets = `
- alertdialog "Delete order?"
- menuitemcheckbox "Show grid" [checked]
- menuitemradio "Compact"
- img "Company logo"
`;
    expect(groupSnapshot(widgets).elements).toEqual({
      dialog: ['Delete order?'],
      'menu item': ['Show grid', 'Compact'],
      image: ['Company logo'],
    });
    expect(describeMissing(new ElementRef('Confirm', 'dialog'), widgets)).toContain(
      'Dialogs on this page: "Delete order?".',
    );
  });

  it('names rows by their first cell, list items and messages by their text', () => {
    const lists = `
- table:
  - rowgroup:
    - row "Order 1001 Pending Delete":
      - cell "Order 1001"
      - cell "Pending"
      - cell "Delete":
        - button "Delete"
- list "Todos":
  - listitem:
    - checkbox "Toggle Todo"
    - text: Buy milk
    - button "Delete"
  - listitem: Walk the dog
- status: Order 1001 deleted
- alert:
  - strong: "Error:"
  - text: Payment failed
`;
    expect(groupSnapshot(lists).elements).toEqual({
      row: ['Order 1001'],
      cell: ['Order 1001', 'Pending', 'Delete'],
      button: ['Delete'],
      list: ['Todos'],
      checkbox: ['Toggle Todo'],
      'list item': ['Buy milk', 'Walk the dog'],
      message: ['Order 1001 deleted', 'Error:'],
    });
  });

  it('explains a missing element inside a container with what the container offers', () => {
    const row = `
- row "Order 1001 Edit":
  - cell "Order 1001"
  - cell "Edit":
    - button "Edit"
`;
    const ref = new ElementRef('Delete', 'button', new ElementRef('Order 1001', 'row'));
    expect(describeMissing(ref, row, 'Orders')).toMatch(
      /^No "Delete" button found in the "Order 1001" row\.\nButtons in the "Order 1001" row: "Edit"\./,
    );
  });

  it('suggests a close name instead of an alias for a typo', () => {
    const row = `
- row "Order 1001 Delete":
  - cell "Order 1001"
  - cell "Delete":
    - button "Delete"
`;
    const ref = new ElementRef('Delet', 'button', new ElementRef('Order 1001', 'row'));
    expect(describeMissing(ref, row, 'Orders', 'pages/orders.json')).toBe(
      [
        'No "Delet" button found in the "Order 1001" row.',
        'Buttons in the "Order 1001" row: "Delete".',
        'Did you mean "Delete"?',
      ].join('\n'),
    );
    expect(describeMissing(new ElementRef('log in', 'button'), snapshot)).toContain(
      'Did you mean "Log in"?',
    );
  });

  it('does not take a different short name for a typo', () => {
    const toolbar = `
- button "Exit"
- button "Same"
`;
    for (const name of ['Edit', 'Save']) {
      expect(describeMissing(new ElementRef(name, 'button'), toolbar)).not.toContain(
        'Did you mean',
      );
    }
  });

  it('lists only texts that share enough words, and capitals only when they differ', () => {
    const orders = `
- paragraph: Order 1001
- paragraph: Order 1002 shipped
- button "Close"
`;
    expect(describeMissingText('Order saved', orders)).toBe(
      'The text "Order saved" is not visible on the page.',
    );
    expect(describeMissingText('Close', orders)).not.toContain('capitals');
  });

  it('explains a missing text with similar texts on the page', () => {
    const login = `
- main:
  - heading "Log in" [level=1]
  - paragraph: Username and password are incorrect.
  - textbox "Username"
  - button "Log in"
`;
    expect(describeMissingText('Email or password is incorrect.', login)).toBe(
      [
        'The text "Email or password is incorrect." is not visible on the page.',
        'Similar texts on this page: "Username and password are incorrect.".',
      ].join('\n'),
    );
    expect(describeMissingText('username and password', login)).toBe(
      [
        'The text "username and password" is not visible on the page.',
        'Similar texts on this page: "Username and password are incorrect.".',
        'Text checks compare capitals too.',
      ].join('\n'),
    );
    expect(describeMissingText('Welcome back!', login)).toBe(
      'The text "Welcome back!" is not visible on the page.',
    );
  });

  it('does not count an empty status area as an element without a name', () => {
    expect(groupSnapshot('- status\n- alert\n- textbox').unnamed).toEqual({ field: 1 });
  });

  it('shows aliases and a redirect in inspect', () => {
    const text = formatInspectResult({
      url: 'http://localhost/login',
      title: 'Log in',
      elements: {},
      unnamed: {},
      aliases: [
        { name: 'Search', type: 'field', count: 1 },
        { name: '"Settings" button', type: 'button', count: 0 },
      ],
      redirectedFrom: 'http://localhost/dashboard',
    });
    expect(text).toContain(
      'The page sent the browser from http://localhost/dashboard to http://localhost/login.',
    );
    expect(text).toContain('--storage-state <file>');
    expect(text).toContain('  the "Search" field\n  the "Settings" button  (finds nothing)');
  });

  it('groups elements by type for inspect', () => {
    expect(groupSnapshot(snapshot)).toEqual({
      elements: {
        dialog: ['Cookie consent'],
        button: ['Accept Cookies', 'Log in'],
        heading: ['Log in'],
        field: ['Username'],
        link: ['Forgot "my" password?'],
      },
      unnamed: { field: 1, button: 1 },
    });
  });
});
