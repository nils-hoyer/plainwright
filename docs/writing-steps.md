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
import { defineStep } from '@codesurfer/plainwright';

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
| `remembers`   | For a step that remembers a value: the name, from the arguments, so `lint` knows it      |
| `fn`          | The code; gets the fixtures, then one argument per parameter                             |

A step that remembers a value keeps it with `world.remember()`, and `remembers` tells `lint` the
name, so later steps may write `{initials}`:

```ts
// steps/names.steps.ts
import { defineStep } from '@codesurfer/plainwright';

defineStep({
  pattern: 'I remember the initials of {string} as {string}',
  description: 'Keeps the first letter of every word, such as "JD" for "Jane Doe".',
  example: 'I remember the initials of "Jane Doe" as "initials"',
  remembers: (args) => String(args[1]),
  fn: ({ world }, name: string, as: string) => {
    world.remember(
      as,
      name
        .split(/\s+/)
        .map((word) => word[0])
        .join(''),
    );
  },
});
```

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
import { defineStep, type ElementRef } from '@codesurfer/plainwright';

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

## Canvas, maps and signature pads

There are no steps that click or move the mouse at a position: a position breaks when the layout
changes, and a reviewer cannot tell what is there. A canvas, a map or a signature pad has no
elements inside to name, so a step in TypeScript finds the element and works out the positions
from its size. The example draws a line across it, as a signature.

```ts
// steps/drawing.steps.ts
import { defineStep, type ElementRef } from '@codesurfer/plainwright';

defineStep({
  pattern: 'I draw a line across the {element}',
  description: 'Draws a line with the mouse from the left to the right of the element.',
  example: 'I draw a line across the "Signature" element',
  fn: async ({ world }, ref: ElementRef) => {
    await world.withElement(ref, async (element) => {
      const box = await element.boundingBox();
      if (!box) throw new Error(`The ${ref} is not visible.`);
      const y = box.y + box.height / 2;
      await world.page.mouse.move(box.x + 10, y);
      await world.page.mouse.down();
      await world.page.mouse.move(box.x + box.width - 10, y, { steps: 10 });
      await world.page.mouse.up();
    });
  },
});
```

## Codes from an authenticator app

For [two-factor login](logging-in.md#email-codes-and-two-factor-login) with an authenticator app,
a step makes the current code from the account's secret, with a library such as
[otpauth](https://www.npmjs.com/package/otpauth) (`npm install --save-dev otpauth`). The secret
comes from the environment, so the code shows as `(hidden)` in the report.

```ts
// steps/login.steps.ts
import { TOTP } from 'otpauth';
import { defineStep } from '@codesurfer/plainwright';

defineStep({
  pattern: 'I remember the authenticator code for {string} as {string}',
  description: 'Keeps the current code of an authenticator app for the secret.',
  example: 'I remember the authenticator code for "{env.TOTP_SECRET}" as "code"',
  remembers: (args) => String(args[1]),
  fn: ({ world }, secret: string, name: string) => {
    world.remember(name, new TOTP({ secret }).generate());
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
import { test as base, useTest, type StepFixtures } from '@codesurfer/plainwright';

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
import { defineStep } from '@codesurfer/plainwright';
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

[Pages](pages.md), [test data](test-data.md) and [keywords](keywords.md) are files that load by
themselves from `pages/`, `data/` and `keywords/`. Pages and data are JSON. In TypeScript the same is
possible, plus what JSON cannot say:

```ts
// steps/pages.ts
import { definePage, definePages, defineData, defineKeywords } from '@codesurfer/plainwright';

definePage('Order', { url: /\/orders\/\d+$/ }); // a RegExp is possible here
definePage('Orders', {
  url: '/orders',
  // an alias can be a function that returns a Locator
  elements: { 'Order total': (scope) => scope.getByTestId('summary').locator('.total') },
});

definePages('e2e/pages'); // page files in another folder
defineData('fixtures/data'); // data files somewhere else
defineKeywords('other/folder/**/*.feature'); // keyword files somewhere else
```
