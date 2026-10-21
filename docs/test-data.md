# Test data

Values are in quotes in the step: `I fill "jane@example.com" in the "Email" field`. The
reviewer sees all data the test uses. As a test suite grows, data that many tests share goes
into files, passwords into the environment, and data a test needs first is created through your
app's API. None of it needs programming. To run the same steps with different data, see
[Scenario Outline](writing-tests.md#the-same-steps-with-different-data).

## Data files

Data that many tests share, such as users or products, goes into JSON files in `data/` (what
Cypress calls fixtures; in Playwright, fixtures are something else). Files in `data/` load by
themselves.

A step refers to a value with its name in braces, inside the quotes. The name is the file name
followed by the keys: `{users.admin.email}`. A file in a folder adds the folder:
`data/shop/products.json` is `{shop.products}`. In a list, a number picks an entry, counted
from 0: `{users.list.0}`. A value can stand anywhere inside the quotes, also in element names:
`the "Delete" button in the "Order {order.id}" row`.

```json
// data/users.json
{
  "admin": {
    "email": "admin@example.com",
    "name": "Ada"
  },
  "member": {
    "email": "jane@example.com",
    "name": "Jane"
  }
}
```

```gherkin
* I fill "{users.admin.email}" in the "Email" field
* I see the text "Welcome, {users.admin.name}!"
```

## Passwords and other secrets

Passwords do not belong in feature files or data files. Put them into environment variables,
or into a `.env` file next to `package.json` that is not committed (`init` adds `.env` to
`.gitignore`). Variables set in the environment win over `.env`, so CI can set its own.

```bash
# .env
TEST_PASSWORD=secret
```

```gherkin
* I fill "{env.TEST_PASSWORD}" in the "Password" field
```

## Values that are not in the files

Some values come from somewhere else than a data file. `{unique}` keeps tests apart that create
data, e.g. `"test-{unique}@example.com"`. Data files may use these values too.

| Written                 | Is                                                                     |
| ----------------------- | ---------------------------------------------------------------------- |
| `{env.TEST_PASSWORD}`   | the environment variable `TEST_PASSWORD`, also from a `.env` file      |
| `{unique}`              | a short text that differs in every test, the same within one test      |
| `{today}`               | today's date, e.g. `2026-10-16`                                        |
| `{order}`, `{order.id}` | a value a step remembered earlier in the same test (see below)         |
| `\{text}`               | the text `{text}` with its braces, when you mean the braces themselves |

## Remembering values

A test can keep a value from the page and use it later. A remembered value lasts until the end
of the test.

The step finds the element by its name, so name it by something that stays the same, not by
the text you want to keep: a field by its label (the step keeps its value), or an element
without a usable name by an [alias](pages.md#elements-without-a-name-aliases). A cell is named
by its own text, so `the "Order number" cell` is the cell with the words "Order number", not
the number next to it.

```gherkin
* I remember the text of the "Order number" field as "order-number"
* I open the url "/orders"
* I see the text "{order-number}"
```

| Step                                                     | What it does                                    |
| -------------------------------------------------------- | ----------------------------------------------- |
| `I remember "Coffee" as "item"`                          | keeps a value under a name                      |
| `I remember the text of the "Order number" field as "x"` | keeps the text of an element or a field's value |

## What the reviewer sees

The step stays as written in the report, `I fill "{users.admin.email}" in the "Email" field`,
and a line below it shows the value used: `{users.admin.email} = "admin@example.com"`. Values
from the environment show as `(hidden)`.

`lint` reports names that do not exist, with what does: `No value {users.admin.phone}:
{users.admin} has no "phone". It has "email", "name".`

## Files to upload

Paths are relative to the project folder: `I upload the file "files/invoice.pdf" with the
"Upload" button` uses `files/invoice.pdf` in your project.

## Data a test creates first

Some tests need data that does not exist yet: a new order, an account in a certain state. Write
one step that says what is there before the test starts, such as
`there is an order for "Coffee"`. The reviewer reads that one line, and the report shows the
steps inside it. In BDD, such a line is often written with `Given` (see
[Given, When, Then](writing-tests.md#given-when-then)).

The step is a [keyword](keywords.md), written once in `keywords/`. `I create` sends the data to
your app's API, checks that it worked, and remembers the answer as `{order}`, so `{order.id}` is
the number the app gave the order. `I delete … after the test` runs when the test is over, also
when it failed. The data to send is a file in `data/`, which can use the remembered item.
Requests use the cookies of the browser, so they are logged in when the browser is, and their
addresses are relative to `baseURL`, like pages.

```gherkin
# features/refunds.feature
Scenario: A paid order can be refunded
  * there is an order for "Coffee"
  * I open the url "/orders/{order.id}"
  * I click the "Refund" button
  * I see the "Order refunded" message
```

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

```json
// data/new-order.json
{
  "item": "{item}",
  "customer": "test-{unique}@example.com",
  "quantity": 1
}
```

### Steps for test data and APIs

All these are advanced steps: they belong in keywords more than in tests, and `lint` marks them
as info. For what they cannot do, such as a database connection or a mock server, developers
can write a fixture in TypeScript: see [steps in TypeScript](writing-steps.md#fixtures).

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
