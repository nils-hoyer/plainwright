# Your own steps

The built-in steps cover what a user does and sees in a browser. For everything specific to your
app there are two ways to add steps:

- **Keywords**, written in Gherkin: a new step made of existing steps. Reviewers can read them.
  Use these first.
- **Steps in TypeScript** with `defineStep()`: for what existing steps cannot express, such as
  calling an API or reading a file.

Both appear in `catalog`, `lint`, `docs` and editor stubs like the built-in steps, and follow
the [vocabulary rules](vocabulary.md).

## Keywords

A keyword is a `Scenario Outline:` whose title is the new step; parameters are written
`"<name>"`. The description under the title becomes the step's documentation, and the first
`Examples` row its example.

```gherkin
# keywords/account.feature
Feature: Account

  Scenario Outline: I log in as "<username>" with password "<password>"
    Opens the login page and logs in.

    * I open the "Login" page
    * I fill "<username>" in the "Username" field
    * I fill "<password>" in the "Password" field
    * I click the "Log in" button

    Examples:
      | username   | password    |
      | 1234567890 | password123 |
```

Files in `keywords/` load by themselves. Keywords in another folder need one line in a step
file: `defineKeywords('other/folder/**/*.feature')`.

Now `* I log in as "1234567890" with password "password123"` works in any feature. The report
shows the keyword's steps nested under it, and errors point to the line in the keyword file.

**Parameters.** A `<name>` in the keyword's steps is replaced by the value only when `name` is a
parameter in the title. Any other `<…>`, such as `"<b>bold</b>"`, is text and stays as written;
`lint` warns when it looks like a misspelled parameter. Values arrive unchanged, backslashes
included.

**Checks before any test runs.** Each step of a keyword must match exactly one step, every
parameter must be used, keywords must not call each other in a loop, and the title must not
match another step. A broken keyword fails with its file and line; `lint` reports the same.

**Limits.** Steps inside keywords must be built-in, keywords, or defined with `defineStep()`
(steps defined directly with playwright-bdd's `Given`/`When`/`Then` are unknown to keywords and
lint). They may use only the `page` and `world` fixtures, which is true for all built-in steps.
Data tables in keywords are not supported yet.

## Steps in TypeScript

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

`description` is one sentence that says exactly what the step does; `example` is a complete step
text that matches this step and no other (`lint` checks it).

The `world` fixture holds the active tab (`world.page`), the active frame, the current page
definition and `world.element(ref)` to resolve an `{element}` parameter, honouring aliases and
containers. `world.withElement(ref, action)` runs an action and, when the element is missing,
adds the list of what the page offers to the error.

**Parameter types.** Use `defineParameterType()` from this package, not from playwright-bdd, so
keywords and `lint` know the type. A step with a type they do not know still runs, but keywords
and `lint` skip it and say so.

## Your own fixtures

Test data a scenario needs first is usually a keyword with the steps for test data and APIs, no
code needed: see [data a test creates first](pages-and-data.md#data-a-test-creates-first). Use a
fixture for what those steps cannot do.

Extend `test` as usual in Playwright and pass it to `useTest()`, so playwright-bdd runs every
feature with it. Steps then get your fixtures like `world`:

```ts
// steps/fixtures.ts
import { test as base, useTest, type StepFixtures } from '@nils.hoyer/plainwright';

type ProjectFixtures = { account: Account };
export type Fixtures = StepFixtures & ProjectFixtures;

export const test = useTest(
  base.extend<ProjectFixtures>({
    account: async ({}, use) => use(await createAccount()),
  }),
);
```

```ts
// steps/account.steps.ts
import { defineStep } from '@nils.hoyer/plainwright';
import type { Fixtures } from './fixtures';

defineStep<Fixtures>({
  pattern: 'I log in with a new account',
  description: 'Logs in on the open login page with a freshly created account.',
  example: 'I log in with a new account',
  fn: async ({ world, account }) => {
    await world.page.getByLabel('Email').fill(account.email);
    // …
  },
});
```

Without `useTest()`, playwright-bdd cannot tell which `test` to import and stops with "Can't
guess test instance". Steps that use your fixtures cannot be used inside keywords, which only
pass `page` and `world`.

## Steps for some features only

As in playwright-bdd, a step file in a folder named after a tag (`steps/@admin/users.steps.ts`)
only applies to scenarios with that tag. Two folders may define the same wording for different
tags. `lint` and `catalog` know the tags.
