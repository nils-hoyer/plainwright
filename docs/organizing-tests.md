# Organizing a test suite

A first test needs one feature file. As the suite grows to dozens of files, a few habits keep
it easy to find your way, to review and to change when the app changes.

## Folders and files by area

One feature file per area of the app, named after it, in folders when there are many:

```
features/
  login.feature
  orders/
    create-order.feature
    refund.feature
  settings/
    profile.feature
```

The `Feature:` line names the area, such as `Feature: Refunds`. `npm test -- refund` runs the
files whose path contains "refund".

## Scenario titles

A title says what the scenario shows, as a fact about the app: `A paid order can be refunded`,
`A wrong password shows an error`. A reviewer reads the titles first, and the report lists
them. Avoid titles that only name the steps, such as `Click refund`, and numbers such as
`Test 3`.

One scenario checks one thing. If a title needs an "and", it is often two scenarios.

## Tags

Tags group scenarios across files. A few are enough, and the team agrees on what they mean:

| Tag        | Use                                                           |
| ---------- | ------------------------------------------------------------- |
| `@smoke`   | a handful of quick tests that show the app works at all       |
| `@slow`    | tests that take long, run less often                          |
| `@wip`     | a test still being written; leave it out with `--grep-invert` |
| `@JIRA-12` | the issue it belongs to, so `--grep @JIRA-12` runs its tests  |

```bash
npm test -- --grep @smoke
npm test -- --grep-invert @wip
```

## Keyword, page or data file

When the same thing appears in several tests, put it in one place:

| It repeats …                             | Put it into                            | Example                                   |
| ---------------------------------------- | -------------------------------------- | ----------------------------------------- |
| several steps, such as logging in        | a [keyword](keywords.md)               | `I am logged in as "{users.admin.email}"` |
| an address, or an element without a name | a [page](pages.md)                     | `I open the "Orders" page`                |
| a value, such as a user or a product     | a [data file](test-data.md#data-files) | `"{users.admin.email}"`                   |
| data a test needs before it starts       | a `Given` keyword                      | `there is an order for "Coffee"`          |

Do not put everything into keywords. A scenario that reads as a list of keywords hides what it
tests: the steps that matter for the check stay in the scenario.

## Keywords stay small

- One keyword does one thing that has a name in the app: logging in, adding to the cart.
- It ends with a check of where it leads, such as `I see the url "/dashboard"`.
- Its title reads like any other step, with values in quotes, following the
  [vocabulary rules](vocabulary.md).
- Keywords live in `keywords/`, one file per area like the features: `keywords/account.feature`,
  `keywords/orders.feature`.

## Tests that run at the same time

Tests run in parallel and in any order. A test that changes data creates that data itself and
gives it a name of its own, such as `"Order {unique}"`, so two tests never change the same
order. See [data a test creates first](test-data.md#data-a-test-creates-first).
