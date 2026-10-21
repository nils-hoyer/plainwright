# Steps in TypeScript

This page is for developers. The built-in steps cover what a user does and sees in a browser,
and [keywords](keywords.md) combine them without code; use those first. A step in TypeScript is
for what existing steps cannot express, such as reading a file or talking to a database.

Steps in TypeScript appear in `catalog`, `lint`, `docs` and the editor like the built-in steps,
and follow the [vocabulary rules](vocabulary.md). Step files in `steps/` load by themselves.

## defineStep

`defineStep()` takes the step text, what it does, an example and the code. Values in quotes
arrive already filled in: `"{users.admin.email}"` reaches `fn` as `admin@example.com`.

```ts
// steps/cart.steps.ts
import { expect } from '@playwright/test';
import { defineStep } from '@nils.hoyer/plainwright';

defineStep({
  pattern: 'I see {string} in the cart',
  description: 'Checks that the cart lists the product.',
  example: 'I see "Coffee" in the cart',
  category: 'Shop',
  fn: async ({ world }, product: string) => {
    await expect(world.page.getByRole('list', { name: 'Cart' })).toContainText(product);
  },
});
```

| Option        | Meaning                                                                                  |
| ------------- | ---------------------------------------------------------------------------------------- |
| `pattern`     | The step text, a [Cucumber expression](https://github.com/cucumber/cucumber-expressions) |
| `description` | One sentence that says exactly what the step does                                        |
| `example`     | A complete step text that matches this step and no other (`lint` checks it)              |
| `category`    | The heading it is listed under in the step reference                                     |
| `level`       | `'core'` or `'advanced'`; advanced steps show as info in `lint`                          |
| `fn`          | The code; gets the fixtures, then one argument per parameter                             |

## The world fixture

`world` is what built-in steps use, and what makes your step behave like them. The example
after the table is a step that takes an element: `world.withElement()` finds it with aliases
and `in the "…" row`, and lists what the page offers when it is missing.

| Member                              | What it is                                                                                |
| ----------------------------------- | ----------------------------------------------------------------------------------------- |
| `world.page`                        | the active browser tab                                                                    |
| `world.scope`                       | where elements are looked up: the active frame, or else the tab                           |
| `world.currentPage`                 | the [page](pages.md) whose aliases are in use                                             |
| `world.element(ref)`                | a Locator for an `{element}` parameter, using aliases and `in the "…" row`                |
| `world.withElement(ref, action)`    | runs `action` on the element; when it is missing, the error lists what the page offers    |
| `world.url(path)`                   | an address relative to `baseURL`                                                          |
| `world.remember(name, value)`       | keeps a value, so later steps can write `"{name}"`                                        |
| `world.request(method, url, body?)` | sends a request with the browser's cookies; the answer is also remembered as `{response}` |
| `world.afterTest(title, action)`    | runs `action` when the test is over, also when it failed                                  |

```ts
// steps/tooltip.steps.ts
import { expect } from '@playwright/test';
import { defineStep, type ElementRef } from '@nils.hoyer/plainwright';

defineStep({
  pattern: 'I see the tooltip {string} on the {element}',
  description: 'Hovers over the element and checks the text of the tooltip it shows.',
  example: 'I see the tooltip "Delete order" on the "Delete" button',
  fn: async ({ world }, text: string, ref: ElementRef) => {
    await world.withElement(ref, (element) => element.hover());
    await expect(world.page.getByRole('tooltip')).toHaveText(text);
  },
});
```

## Parameter types

Use `defineParameterType()` from this package, not from playwright-bdd, so keywords and `lint`
know the type. A step with a type they do not know still runs, but keywords and `lint` skip it
and say so (`unknown-parameter-type`).

## Fixtures

Test data a scenario needs first is usually a keyword, no code needed: see
[data a test creates first](test-data.md#data-a-test-creates-first). A fixture is for what
those steps cannot do: data the API cannot create, a database connection, a mock server. It
prepares something before the scenario and removes it afterwards, and reviewers only see the
step that uses it.

Extend `test` as usual in Playwright and pass it to `useTest()`, so playwright-bdd runs every
feature with it. Steps then get your fixtures like `world`. The fixture only runs in scenarios
that use a step that needs it, here `I open a new order`. Without `useTest()`, playwright-bdd
cannot tell which `test` to import and stops with "Can't guess test instance". Steps that use
your fixtures cannot be used inside keywords, which only pass `page` and `world`.

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

## Pages and data in TypeScript

[Pages](pages.md) and [test data](test-data.md) are JSON files. In TypeScript the same is
possible, plus what JSON cannot say:

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

## Steps for some features only

As in playwright-bdd, a step file in a folder named after a tag (`steps/@admin/users.steps.ts`)
only applies to scenarios with that tag; in a scenario without it, the step fails. Two folders
may define the same wording for different tags, and a step for the scenario's tag wins over
one without tags. A scenario without any tags is the exception: playwright-bdd then counts the
steps of every folder, so a wording that a tag folder also defines matches several steps there.
`lint` reports both, and `catalog` lists the tags.
