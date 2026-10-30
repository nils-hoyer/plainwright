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
* I see the url "/dashboard"
```

| Step                           | What it does                                                          |
| ------------------------------ | --------------------------------------------------------------------- |
| `I open the "Login" page`      | opens the address of the page and makes it the current page           |
| `I am on the "Dashboard" page` | makes it the current page, without opening it or checking its address |

### Addresses with wildcards

In an address, `*` stands for any text without `/` and `**` for any text. Such a page, like
`"url": "/orders/*"`, cannot be opened: open the address with `I open the url "/orders/1001"`,
then `I am on the "Order" page`. `lint` reports an `I open the "Order" page` for it. A page needs
no `url` at all when it is only switched to, such as a step of a wizard.

### Where page files live

Files in `pages/` load by themselves. If your app has its own `pages/` folder with source files
(Next.js, Nuxt, Astro), Plainwright leaves it alone and says so; keep the page files in another
folder and load it with `definePages('<folder>')` in a step file (see
[steps in TypeScript](writing-steps.md#pages-and-data-in-typescript)).

## Elements without a name: aliases

A step finds an element by what the user sees. Some elements show nothing usable: an icon-only
button, a field without a label. Give them a name in the page's file under `elements`. Tests use
the names, and the selector stays in the page file.

An alias is a name alone and works with any element type: `the "Search" field`. A selector is
CSS, or any Playwright selector such as `text=Total`. For anything more specific,
`definePage()` in TypeScript also takes a function that returns a Locator (see
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
    "Settings icon": "[data-testid=settings]"
  }
}
```

```gherkin
* I open the "Orders" page
* I fill "1001" in the "Search" field
* I click the "Settings icon" button
* I see the "Settings" dialog
```

The icon-only button opens a dialog with the title "Settings". Named "Settings", the alias would
also stand for `the "Settings" dialog`, so the button gets a name of its own, and the dialog is
still found by its title.

### Names that change

A name with a part that changes, such as the counter in a "Cart (3)" button, cannot be written
in a test that should pass with any count. Its alias finds the element by the start of its name,
with a Playwright selector: `role=button[name=/^Cart/]` is a button whose name starts with
"Cart". Tests then write `the "Cart" button`, and `I see the text "Cart (3)" in the "Cart"
button` checks the count.

```json
"elements": {
  "Cart": "role=button[name=/^Cart/]"
}
```

### The current page

```gherkin
* I open the "Orders" page
* I click the "Order 1001" link
* I see the "Order 1001" heading
* I am on the "Order" page
* I click the "Print" button
```

An alias applies while its page is the current page. `I open the "…" page` and
`I am on the "…" page` set the current page; nothing else changes it, also not
`I open the url "…"`. Elements found by their visible name work on any page.

You decide when the next steps are on another page. After a click or an `I open the url` that
leads there, add `I am on the "…" page`, so that its aliases apply.

`I am on` checks nothing and does not wait. To wait for the new page, check something on it
first, such as its heading or `I see the url "…"`, as above.

Several pages can share one address, such as the steps of a wizard or the views of an app that
does everything at `/`: `I am on the "Step 2" page` switches between them.

When an element is missing and the browser does not show the current page's address, the error
says so and names the `I am on` step to add.

## Suggestions in VS Code

VS Code suggests and checks what you write in page files with one setting. `init` writes it,
and the starter has it:

```jsonc
// .vscode/settings.json
{
  "json.schemas": [
    {
      "fileMatch": ["**/pages/**/*.json"],
      "url": "./node_modules/@codesurfer/plainwright/schema/page.json",
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
