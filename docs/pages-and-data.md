# Pages, test data and fixtures

A test needs nothing but addresses and the names on the screen:

```gherkin
* I open the url "/login"
* I fill "jane@example.com" in the "Email" field
* I click the "Log in" button
* I see the url "/dashboard"
```

This page is for when a test suite grows. Everything on it is optional, you can add it one part
at a time, and none of it needs programming: pages and test data are JSON files, and test data
that a test creates first is a keyword. TypeScript stays possible, at the end of this page.

## Named pages

Each page is a small JSON file in `pages/`, with its name and its address:

```
pages/
  login.json
  dashboard.json
  order.json
```

```json
// pages/login.json
{ "name": "Login", "url": "/login" }
```

`name` is what tests write, with the same spelling and capitals; the file name is up to you.
Tests then use the name instead of the address:

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

When an address changes, you change it in one place. In an address, `*` stands for any text
without `/` and `**` for any text. Such a page, like `{ "name": "Order", "url": "/orders/*" }`,
can only be checked with `I am on the "Order" page`, not opened.

VS Code suggests and checks what you write in these files with one setting, which the starter
already has:

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

If your app has its own `pages/` folder with source files (Next.js, Nuxt, Astro), Plainwright
leaves it alone and says so; keep the page files in another folder and load it with
`definePages('<folder>')` (see [in TypeScript](#in-typescript)).

### The current page and aliases

Some elements have no visible name, such as an icon-only button. A page can give them one, an
alias:

```json
// pages/orders.json
{
  "name": "Orders",
  "url": "/orders",
  "elements": { "Search": "[data-testid=search]" }
}
```

An alias applies while its page is the current page. `I open the "…" page` and
`I am on the "…" page` set the current page; `I open the url "…"` clears it. When a click leads
to another page, add `I am on the "…" page` so that its aliases apply. Elements found by their
visible name work on any page. More about aliases in [setup](setup.md#elements-without-a-usable-name-aliases).

### Compared with page objects

A classic page object is a class per page with selectors and methods. In Plainwright:

- **Addresses** go into a file per page in `pages/`, like a page object per page.
- **Selectors** are only needed as aliases for elements without a visible name.
- **Methods** such as `login()` become keywords: a new sentence made of existing steps, in
  `keywords/*.feature`, that reviewers can read. See [your own steps](writing-steps.md#keywords).

## Test data

### In the sentence

Values are in quotes in the step: `I fill "jane@example.com" in the "Email" field`. The reviewer
sees all data the test uses.

### The same steps with different data

A `Scenario Outline` runs once for every row of its `Examples` table. Each row is its own test in
the report.

```gherkin
Feature: Login

  Scenario Outline: A wrong login shows an error
    * I open the url "/login"
    * I fill "<email>" in the "Email" field
    * I fill "<password>" in the "Password" field
    * I click the "Log in" button
    * I see the text "<error>"

    Examples:
      | email            | password | error                           |
      | jane@example.com | wrong    | Email or password is incorrect. |
      | jane@example     | secret   | Enter a valid email address.    |
```

A `Scenario Outline` in `features/` is a test; in `keywords/` it defines a new sentence.

### Data files

Data that many tests share, such as users or products, goes into JSON files in `data/` (what
Cypress calls fixtures; in Playwright, fixtures are something else, see [fixtures](#fixtures)):

```json
// data/users.json
{
  "admin": { "email": "admin@example.com", "name": "Ada" },
  "member": { "email": "jane@example.com", "name": "Jane" }
}
```

A step refers to a value with its name in braces, inside the quotes:

```gherkin
* I fill "{users.admin.email}" in the "Email" field
* I see the text "Welcome, {users.admin.name}!"
```

The name is the file name followed by the keys: `{users.admin.email}`. A file in a folder adds
the folder: `data/shop/products.json` is `{shop.products}`. In a list, a number picks an entry,
counted from 0: `{users.list.0}`. A value can stand anywhere inside the quotes, also in element
names: `the "Delete" button in the "Order {order.id}" row`.

### Values that are not in the files

| Written                 | Is                                                                     |
| ----------------------- | ---------------------------------------------------------------------- |
| `{env.TEST_PASSWORD}`   | the environment variable `TEST_PASSWORD`, also from a `.env` file      |
| `{unique}`              | a short text that differs in every test, the same within one test      |
| `{today}`               | today's date, e.g. `2026-10-16`                                        |
| `{order}`, `{order.id}` | a value a step remembered earlier in the same test (see below)         |
| `\{text}`               | the text `{text}` with its braces, when you mean the braces themselves |

`{unique}` keeps tests apart that create data, e.g. `"test-{unique}@example.com"`. Data files
may use these values too.

Passwords and other secrets do not belong in feature files or data files. Put them into
environment variables, or into a `.env` file next to `package.json` that is not committed (add
`.env` to `.gitignore`):

```bash
# .env
TEST_PASSWORD=secret
```

Variables set in the environment win over `.env`, so CI can set its own.

### What the reviewer sees

The step stays as written in the report, `I fill "{users.admin.email}" in the "Email" field`,
and a line below it shows the value used: `{users.admin.email} = "admin@example.com"`. Values
from the environment show as `(hidden)`.

`lint` reports names that do not exist, with what does: `No value {users.admin.phone}:
{users.admin} has no "phone". It has "email", "name".`

### Remembering values

A test can keep a value from the page and use it later:

```gherkin
* I remember the text of the "Order number" cell as "order number"
* I open the url "/orders"
* I see the text "{order number}"
```

| Step                                                    | What it does                                    |
| ------------------------------------------------------- | ----------------------------------------------- |
| `I remember "Coffee" as "item"`                         | keeps a value under a name                      |
| `I remember the text of the "Order number" cell as "x"` | keeps the text of an element or a field's value |

A remembered value lasts until the end of the test.

### Steps every scenario starts with

Steps under `Background:` run before every scenario of the feature, for example
`I open the url "/login"`.

### Files to upload

Paths are relative to the project folder: `I upload the file "files/invoice.pdf" with the
"Upload" button` uses `files/invoice.pdf` in your project.

### Other environments

Addresses are relative to `baseURL` in `playwright.config.ts`. Read it from an environment
variable to run the same tests against another environment:

```ts
use: { baseURL: process.env.BASE_URL ?? 'http://localhost:3000' },
```

```bash
BASE_URL=https://staging.example.com npx playwright test
```

To stay logged in across tests, log in once in a setup file: see [logging in once](logging-in.md).

## Data a test creates first

Some tests need data that does not exist yet: a new order, an account in a certain state. In BDD
this is a `Given` line that says what is there before the test starts:

```gherkin
Scenario: A paid order can be refunded
  Given there is an order for "Coffee"
  When I open the url "/orders/{order.id}"
  And I click the "Refund" button
  Then I see the "Order refunded" message
```

`there is an order for "…"` is a keyword, written once in `keywords/`:

```gherkin
# keywords/orders.feature
Feature: Orders

  Scenario Outline: there is an order for "<item>"
    Creates an order through the API and deletes it after the test.

    * I remember "<item>" as "item"
    * I create "order" at "/api/orders" with "{new-order}"
    * I delete "/api/orders/{order.id}" after the test

    Examples:
      | item   |
      | Coffee |
```

The data to send is a file in `data/`, which can use the remembered item:

```json
// data/new-order.json
{ "item": "{item}", "customer": "test-{unique}@example.com", "quantity": 1 }
```

`I create` sends the data to your app's API, checks that it worked, and remembers the answer as
`{order}`, so `{order.id}` is the number the app gave the order. `I delete … after the test` runs
when the test is over, also when it failed. The reviewer reads one line, `Given there is an order
for "Coffee"`, and the report shows the steps inside it.

Requests use the cookies of the browser, so they are logged in when the browser is, and their
addresses are relative to `baseURL`, like pages.

### Steps for test data and APIs

| Step                                                            | What it does                                                                   |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `I create "order" at "/api/orders" with "{new-order}"`          | sends the data (POST), checks it worked, remembers the answer                  |
| `I delete "/api/orders/{order.id}" after the test`              | deletes it when the test is over; already gone counts as deleted               |
| `I send a "GET" request to "/api/orders"`                       | sends a request; the answer is `{response}`                                    |
| `I send a "PATCH" request to "/api/orders/{order.id}" with "…"` | sends a request with data                                                      |
| `I see the response status "200"`                               | checks the status of the last answer                                           |
| `I see the response field "status" with the value "paid"`       | checks a field of the last answer; `items.0.name` reaches into lists           |
| `I run the command "npm run db:seed"`                           | runs a command in the project folder, e.g. your script that fills the database |
| `I see the text "Total" in the downloaded file`                 | checks the content of the last download                                        |

All are advanced steps: they belong in keywords more than in tests. `lint` marks them as info.

## In TypeScript

Everything above works without code. Developers can do the same in TypeScript, in files in
`steps/`:

```ts
// steps/pages.ts
import { definePage, definePages, defineData } from '@nils.hoyer/plainwright';

definePage('Order', { url: /\/orders\/\d+$/ }); // a RegExp is possible here
definePage('Orders', {
  url: '/orders',
  // an alias can be a function that returns a Locator
  elements: { 'Order total': (scope) => scope.getByTestId('summary').locator('.total') },
});

definePages('e2e/pages'); // page files in another folder
defineData('fixtures/data'); // data files somewhere else
```

### Fixtures

A fixture prepares something in TypeScript before the scenario and removes it afterwards: data
the API above cannot create, a database connection, a mock server. Reviewers only see the step
that uses it.

```ts
// steps/fixtures.ts
import { test as base, useTest, type StepFixtures } from '@nils.hoyer/plainwright';

type ProjectFixtures = { order: { id: string } };
export type Fixtures = StepFixtures & ProjectFixtures;

export const test = useTest(
  base.extend<ProjectFixtures>({
    order: async ({ request }, use) => {
      const response = await request.post('/api/orders', { data: { item: 'Coffee' } });
      const order = await response.json();
      await use(order);
      await request.delete(`/api/orders/${order.id}`);
    },
  }),
);
```

```ts
// steps/orders.steps.ts
import { defineStep } from '@nils.hoyer/plainwright';
import type { Fixtures } from './fixtures';

defineStep<Fixtures>({
  pattern: 'I open a new order',
  description: 'Creates an order through the API and opens its page.',
  example: 'I open a new order',
  fn: async ({ world, order }) => {
    await world.page.goto(`/orders/${order.id}`);
  },
});
```

The fixture only runs in scenarios that use `I open a new order`. Steps with your own fixtures
cannot be used inside keywords. A step in TypeScript can remember a value for later steps with
`world.remember('order', order)`. More in [your own steps](writing-steps.md#your-own-fixtures).

## Where things go

| File                 | Contains                                                  | Loads             |
| -------------------- | --------------------------------------------------------- | ----------------- |
| `features/*.feature` | the tests                                                 | by playwright-bdd |
| `keywords/*.feature` | your own sentences made of existing steps                 | by itself         |
| `pages/*.json`       | named pages and aliases, one page per file                | by itself         |
| `data/*.json`        | test data, written `{file.key}` in steps                  | by itself         |
| `.env`               | secrets and settings, written `{env.NAME}`; not committed | by itself         |
| `steps/*.ts`         | steps, pages and fixtures in TypeScript (optional)        | by playwright-bdd |
| `setup/*.setup.ts`   | logging in once, see [logging in once](logging-in.md)     | by Playwright     |

"By itself" means from the project folder, the folder you run `npm test` in.
