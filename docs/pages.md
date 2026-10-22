# Pages

A test needs nothing but addresses and the names on the screen. As a test suite grows, give
your pages a name: an address then changes in one place, and an element without a visible name
gets one. Pages are small JSON files; no programming needed.

## Named pages

Each page is a file in `pages/`, with its name and its address. `name` is what tests write, with
the same spelling and capitals; the file name is up to you. Tests then use the name instead of
the address, with the steps in the table below.

```
pages/
  login.json
  dashboard.json
  order.json
```

```json
// pages/login.json
{
  "name": "Login",
  "url": "/login"
}
```

```gherkin
* I open the "Login" page
* I fill "jane@example.com" in the "Email" field
* I click the "Log in" button
* I am on the "Dashboard" page
```

| Step                           | What it does                                                            |
| ------------------------------ | ----------------------------------------------------------------------- |
| `I open the "Login" page`      | opens the address of the page                                           |
| `I am on the "Dashboard" page` | checks that the browser shows the address of the page, and waits for it |

### Addresses with wildcards

In an address, `*` stands for any text without `/` and `**` for any text. Such a page, like
`"url": "/orders/*"`, can only be checked with `I am on the "Order" page`, not opened. `lint`
reports an `I open the "Order" page` for it.

### Where page files live

Files in `pages/` load by themselves. If your app has its own `pages/` folder with source files
(Next.js, Nuxt, Astro), Plainwright leaves it alone and says so; keep the page files in another
folder and load it with `definePages('<folder>')` in a step file (see
[steps in TypeScript](writing-steps.md#pages-and-data-in-typescript)).

## Elements without a name: aliases

A step finds an element by what the user sees. Some elements show nothing usable: an icon-only
button, a field without a label. Give them a name in the page's file under `elements`. Tests use
the names, and the selector stays in the page file.

`Search` works with any element type: `the "Search" field`. `Settings` names the type too, so
only `the "Settings" button` uses the alias, and a "Settings" dialog is still found by its
title; VS Code suggests the types (see [below](#suggestions-in-vs-code)). When one name stands
for elements of several types, list them: `"Total": [{ "type": "cell", "selector": "#total" },
{ "type": "heading", "selector": "h2" }]`. A selector is CSS, or any Playwright selector such as
`text=Total`. For anything more specific, `definePage()` in TypeScript also takes a function
that returns a Locator (see
[steps in TypeScript](writing-steps.md#pages-and-data-in-typescript)).

Use aliases sparingly: an element without a visible name is usually also a problem for people
who use a screen reader, and worth fixing in the app. Several elements with the same name need
no alias: `the "Delete" button in the "Order 1001" row`.

```json
// pages/orders.json
{
  "name": "Orders",
  "url": "/orders",
  "elements": {
    "Search": "[data-testid=search]",
    "Settings": { "type": "button", "selector": "[data-testid=settings]" }
  }
}
```

```gherkin
* I open the "Orders" page
* I fill "1001" in the "Search" field
* I click the "Settings" button
```

### Names that change

A name with a part that changes, such as the counter in a "Cart (3)" button, cannot be written
in a test that should pass with any count. Its alias finds the element by the start of its name,
with a Playwright selector: `role=button[name=/^Cart/]` is a button whose name starts with
"Cart". Tests then write `the "Cart" button`, and `I see the text "Cart (3)" in the "Cart"
button` checks the count.

```json
"elements": {
  "Cart": { "type": "button", "selector": "role=button[name=/^Cart/]" }
}
```

### Where an alias applies

An alias applies on its page: the page whose `url` matches the address the browser shows, however
the test got there, by name, by address or by a click. On other pages the same name is looked up
by what the user sees, so an alias for an unlabelled "Search" field on the Orders page does not
hide a labelled "Search" field elsewhere. Elements found by their visible name work on any page.

After a click that leads to another page, add `I am on the "…" page`: it waits until the browser
shows that page's address, so the next step finds the new page's aliases and does not start too
early.

```gherkin
* I open the "Orders" page
* I click the "Order 1001" link
* I am on the "Order" page
* I click the "Print" button
```

- **Several pages at one address,** such as the steps of a wizard or the views of a single-page
  app that does not change its address: give each the same `url`. Their aliases apply together;
  two of them must not give the same name different selectors.
- **A page file without `url`** applies on every page, for parts that every page has, such as a
  header with icon buttons.
- **Exactly this address wins:** when a page with `/orders/1001` and a page with `/orders/*`
  both match, the first one's alias wins, and a page without `url` comes last.

## Suggestions in VS Code

VS Code suggests and checks what you write in page files with one setting. `init` writes it,
and the starter has it:

```jsonc
// .vscode/settings.json
{
  "json.schemas": [
    {
      "fileMatch": ["**/pages/**/*.json"],
      "url": "./node_modules/@nils.hoyer/plainwright/schema/page.json",
    },
  ],
}
```

## Compared with page objects

A classic page object is a class per page with selectors and methods. In Plainwright:

- **Addresses** go into a file per page in `pages/`, like a page object per page.
- **Selectors** are only needed as aliases for elements without a visible name.
- **Methods** such as `login()` become keywords: a new step made of existing steps, in
  `keywords/*.feature`, that reviewers can read. See [keywords](keywords.md).
