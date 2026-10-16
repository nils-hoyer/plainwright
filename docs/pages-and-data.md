# Pages, test data and fixtures

A test needs nothing but addresses and the names on the screen:

```gherkin
* I open the url "/login"
* I fill "jane@example.com" in the "Email" field
* I click the "Log in" button
* I see the url "/dashboard"
```

This page is for when a test suite grows. Everything on it is optional, and you can add it one
part at a time.

## Named pages

Give a page a name and its address in `steps/pages.ts`:

```ts
// steps/pages.ts
import { definePage } from '@nils.hoyer/plainwright';

definePage('Login', { url: '/login' });
definePage('Dashboard', { url: '/dashboard' });
definePage('Order', { url: /\/orders\/\d+$/ });
```

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

When an address changes, you change it in one place. An address written as a pattern
(`/\/orders\/\d+$/`) can only be checked with `I am on the "Order" page`, not opened.

### The current page and aliases

Some elements have no visible name, such as an icon-only button. A page can give them one, an
alias:

```ts
definePage('Orders', {
  url: '/orders',
  elements: { Search: '[data-testid="search"]' },
});
```

An alias applies while its page is the current page. `I open the "…" page` and
`I am on the "…" page` set the current page; `I open the url "…"` clears it. When a click leads
to another page, add `I am on the "…" page` so that its aliases apply. Elements found by their
visible name work on any page. More about aliases in [setup](setup.md#elements-without-a-usable-name-aliases).

### Compared with page objects

A classic page object is a class per page with selectors and methods. In Plainwright:

- **Addresses** go into `definePage()`.
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

Passwords do not belong in feature files. Log in once in a setup file that reads them from
environment variables: see [logging in once](logging-in.md).

## Data prepared in code: fixtures

Some tests need data that does not exist yet: a new account, an order with a certain state. A
fixture prepares it in TypeScript before the scenario and removes it afterwards. Reviewers only
see the step that uses it.

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
cannot be used inside keywords. More in [your own steps](writing-steps.md#your-own-fixtures).

## Where things go

| File                 | Contains                                              |
| -------------------- | ----------------------------------------------------- |
| `features/*.feature` | the tests                                             |
| `keywords/*.feature` | your own sentences made of existing steps             |
| `steps/pages.ts`     | named pages and aliases                               |
| `steps/fixtures.ts`  | the `test` with your fixtures                         |
| `steps/*.steps.ts`   | steps in TypeScript                                   |
| `setup/*.setup.ts`   | logging in once, see [logging in once](logging-in.md) |
