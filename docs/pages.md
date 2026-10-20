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

| Step                            | What it does                                                     |
| ------------------------------- | ---------------------------------------------------------------- |
| `I open the "Login" page`       | opens the address of the page and makes it the current page      |
| `I am on the "Dashboard" page`  | checks the address of the page and makes it the current page     |
| `I use the page object "Login"` | makes it the current page without opening or checking (advanced) |

### Addresses with wildcards

In an address, `*` stands for any text without `/` and `**` for any text. Such a page, like
`"url": "/orders/*"`, can only be checked with `I am on the "Order" page`, not opened.

### Where page files live

Files in `pages/` load by themselves. If your app has its own `pages/` folder with source files
(Next.js, Nuxt, Astro), Plainwright leaves it alone and says so; keep the page files in another
folder and load it with `definePages('<folder>')` in a step file (see
[steps in TypeScript](writing-steps.md#pages-and-data-in-typescript)).

## Elements without a name: aliases

A step finds an element by what the user sees. Some elements show nothing usable: an icon-only
button, a field without a label. Give them a name in the page's file under `elements`. Tests use
the names, and the selector stays in the page file.

`Search` works with any element type: `the "Search" field`. The second key names the type too,
so only `the "Settings" button` uses the alias, and a "Settings" dialog is still found by its
title. A selector is CSS, or any Playwright selector such as `text=Total`. For anything more
specific, `definePage()` in TypeScript also takes a function that returns a Locator (see
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
    "\"Settings\" button": "[data-testid=settings]"
  }
}
```

```gherkin
* I open the "Orders" page
* I fill "1001" in the "Search" field
* I click the "Settings" button
```

### The current page

An alias applies while its page is the current page. `I open the "…" page` and
`I am on the "…" page` set the current page; `I open the url "…"` clears it. When a click leads
to another page, add `I am on the "…" page` so that its aliases apply. Elements found by their
visible name work on any page.

```gherkin
* I open the "Orders" page
* I click the "Order 1001" link
* I am on the "Order" page
* I click the "Print" button
```

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
