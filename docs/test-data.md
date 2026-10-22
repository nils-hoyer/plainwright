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
| `{today}`               | today's date, e.g. `2026-10-21`                                        |
| `{tomorrow}`            | tomorrow's date; `{yesterday}` the day before today                    |
| `{in-7-days}`           | the date 7 days from today, for any number of days                     |
| `{7-days-ago}`          | the date 7 days before today                                           |
| `{order}`, `{order.id}` | a value a step remembered earlier in the same test (see below)         |
| `\{text}`               | the text `{text}` with its braces, when you mean the braces themselves |

Dates are written `2026-10-21`, which is what a date field (`<input type="date">`) takes:
`I fill "{in-7-days}" in the "Delivery date" field`. To check a date as the page shows it, add a
part. "Today" is the date where the browser is: in the time zone of `use.timezoneId` in
`playwright.config.ts` when it is set, so near midnight the test and the browser agree.

| Written         | Is                                                                                                                         |
| --------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `{today.local}` | the date as the browser writes it in its language (`use.locale`): `21.10.2026` in German, `10/21/2026` in American English |
| `{today.day}`   | the day, `21`; with two digits, `05`                                                                                       |
| `{today.month}` | the month, `10`; with two digits, `03`                                                                                     |
| `{today.year}`  | the year, `2026`                                                                                                           |

Every date has these parts: `{in-7-days.local}`, `{tomorrow.day}`. The day, month and year are
for date pickers with a field for each.

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

Apps often show a new record's number only inside a sentence, such as "Order #10234 was
created", or only in the address after saving, `/orders/10234`. Two steps take the number out:

```gherkin
* I click the "Save" button
* I am on the "Order" page
* I remember the first number in the "was created" message as "order"
* I remember the last number in the url as "order-in-address"
* I open the url "/orders"
* I see the text "Order {order}" in the "Recent orders" list
```

A number is digits, with `.` or `,` between digits as the page writes them: `10234`, `12,50`,
`1.234,56`. It is kept as text, so `00042` stays `00042`. The step waits until the element, or
the address, has a number. Before taking the number from the address, check that the browser
shows the new one, with a [page](pages.md) whose address is `/orders/*` (`I am on the "Order"
page`): the old address may have a number too, such as `/customers/7/orders/new`.

| Step                                                                   | What it does                                                                                         |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `I remember "Coffee" as "item"`                                        | keeps a value under a name                                                                           |
| `I remember the text of the "Order number" field as "x"`               | keeps the text of an element or a field's value                                                      |
| `I remember the first number in the "Confirmation" message as "order"` | keeps the first number in the text of an element, or in a field's value                              |
| `I remember the last number in the url as "order"`                     | keeps the last number in the path of the address (`/api/v2/orders/17` gives `17`), else in the query |
| `I remember the url as "order-page"`                                   | keeps the address, `/orders/10234` on your app, the full address on another website                  |

### Values last for one test

Tests run in parallel and in any order, so a value one test remembered is not there in another.
Data that several tests need goes into a file in `data/`, or into a `Given` keyword that creates
it in each test (see [below](#data-a-test-creates-first)). `lint` reports a value used before
a step remembers it, and one that only another scenario remembers:

```
features/orders.feature:12: error: {order} is remembered later, in line 14. Remember it before using it. (unknown-value)
features/orders.feature:20: error: {order} is only remembered in another scenario (line 14). Remembered values last for one test: remember it in this scenario, or put it into a file in data/. (unknown-value)
```

## What the reviewer sees

The step stays as written in the report, `I fill "{users.admin.email}" in the "Email" field`,
and a line below it shows the value used: `{users.admin.email} = "admin@example.com"`. A step
that remembers a value shows it the same way: `remembered {order} = "10234"`. Values from the
environment show as `(hidden)`, and so does a value remembered from one.

`lint` reports names that do not exist, with what does: `No value {users.admin.phone}:
{users.admin} has no "phone". It has "email", "name".`

## Files to upload

Paths are relative to the project folder: `I upload the file "files/invoice.pdf" with the
"Upload" button` uses `files/invoice.pdf` in your project.

A file the app offers for download can go back in, for an export that is imported again. It keeps
the name the app gave it.

```gherkin
* I download the file with the "Export" button
* I open the "Import" page
* I upload the downloaded file with the "Choose file" button
* I see the text "orders.csv" in the "Chosen file" section
```

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

| Step                                                            | What it does                                                         |
| --------------------------------------------------------------- | -------------------------------------------------------------------- |
| `I create "order" at "/api/orders" with "{new-order}"`          | sends the data (POST), checks it worked, remembers the answer        |
| `I delete "/api/orders/{order.id}" after the test`              | deletes it when the test is over; already gone counts as deleted     |
| `I send a "GET" request to "/api/orders"`                       | sends a request; the answer is `{response}`                          |
| `I send a "PATCH" request to "/api/orders/{order.id}" with "…"` | sends a request with data                                            |
| `I see the response status "200"`                               | checks the status of the last answer                                 |
| `I see the response field "status" with the value "paid"`       | checks a field of the last answer; `items.0.name` reaches into lists |
| `I see the text "Total" in the downloaded file`                 | checks the content of the last download                              |
