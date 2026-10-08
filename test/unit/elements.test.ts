import { describe, expect, it } from 'vitest';
import { parseAriaSnapshot } from '../../src/aria';
import { describeMissing, ElementRef, locate, Scope } from '../../src/elements';
import { findStep } from '../../src/index';
import { groupSnapshot } from '../../src/inspect';

/** A stand-in for Page/FrameLocator that records how a locator was built. */
function fakeScope(): Scope {
  const node = (description: string): unknown => ({
    description,
    or: (other: { description: string }) => node(`${description}.or(${other.description})`),
    and: (other: { description: string }) => node(`${description}.and(${other.description})`),
  });
  const method =
    (name: string) =>
    (...args: unknown[]) =>
      node(`${name}(${args.map((a) => JSON.stringify(a)).join(', ')})`);
  return {
    getByRole: method('getByRole'),
    getByLabel: method('getByLabel'),
    getByPlaceholder: method('getByPlaceholder'),
    getByAltText: method('getByAltText'),
    getByText: method('getByText'),
    locator: method('locator'),
  } as unknown as Scope;
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
    expect(parseAriaSnapshot(snapshot)).toEqual([
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
    expect(describeMissing(new ElementRef('Log on', 'button'), snapshot, 'Login')).toBe(
      [
        'No "Log on" button found on the "Login" page.',
        'Buttons on this page: "Accept Cookies", "Log in".',
        `If the element has no visible name, add an alias: definePage('Login', { elements: { 'Log on': '<selector>' } }).`,
      ].join('\n'),
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
