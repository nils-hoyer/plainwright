# Troubleshooting

What to do when a test fails or does not do what you expect, by what you see. Most problems
show before any browser opens: run `npm run lint` first.

## An element is not found

```
No "Sign in" button found on the "Login" page.
Buttons on this page: "Accept Cookies", "Log in".
```

The error lists the elements of that type the page offers. Compare the name in your step with
the list:

- **Names match exactly**, with the same capitals: `the "Log in" button` does not find a button
  "Log In". Copy the name from the error.
- **The type is part of the name.** A link that looks like a button is still a link:
  `the "Sign up" link`. `npm run inspect -- "/login"` lists every element of a page by the
  names and types steps use.
- **The element has no visible name**, such as an icon-only button: give it an
  [alias](pages.md#elements-without-a-name-aliases).
- **The page is not there yet.** Steps wait up to 10 seconds for an element. If the page shows
  something else, open the trace of the test in the
  [report](reading-tests.md#opening-the-report): it shows the page at every step.

## Several elements match

```
strict mode violation: getByRole('button', { name: 'Delete', exact: true }) resolved to 2 elements
```

Several elements have this name, such as a "Delete" button in every row. Name the element they
are in: `I click the "Delete" button in the "Order 1001" row`. See
[elements with the same name](writing-tests.md#elements-with-the-same-name).

## An alias does not apply

An [alias](pages.md#elements-without-a-name-aliases) applies while its page is the current
page. After a click or an `I open the url` that leads to another page, add
`I am on the "…" page`. The error says so when the browser does not show the current page's
address:

```
It is not the address of the "Dashboard" page, so the element names defined for it may not fit.
When a click led to another page, add I am on the "Orders" page before this step.
```

## A value is unknown

`{users.admin.email}`, `{order}` or `{env.TEST_PASSWORD}` is not filled in, or `lint` says
`No value named …`. `lint` lists what there is: the keys of the data file, or the line where a
value is remembered later. A remembered value lasts for one test; see
[values last for one test](test-data.md#values-last-for-one-test). An environment variable that
is not set is a warning, because CI often sets it only for the test run.

## A step starts too early

A step fails now and then, often right after a click that opens another page or saves
something. The click is done when the browser has clicked, not when the app has answered. Check
for what the user waits for before the next step: `I see the url "/dashboard"`,
`I see the "Order saved" message`. Every check waits by itself, up to 5 seconds. End every
[keyword](keywords.md) with such a check. A fixed wait (`I wait "2" seconds`) is too long on
fast days and too short on slow ones.

## A test fails now and then

Open the failed test in the report and its trace: it replays the test step by step, with the
page as it was at each step. Most tests that fail now and then have a step that starts too
early (see above) or share data with another test that runs at the same time. Give data a test
creates its own name, such as `"Order {unique}"`, and create it in the test, not once for all
(see [data a test creates first](test-data.md#data-a-test-creates-first)).

## It passes on my machine and fails in CI

- **The address**: CI runs the app at another address. Set it with an environment variable,
  see [other environments](setup.md#other-environments).
- **Secrets**: there is no `.env` file in CI. Set the variables as secrets of the CI system, see
  [running in CI](setup.md#running-in-ci).
- **Screenshots**: a screenshot made on a Mac does not count on Linux, where CI usually runs.
  See [checks against a screenshot](writing-tests.md#checks-against-a-screenshot).
- **Speed**: CI machines are slower, so a step that starts too early fails more often there.

## A step does not exist

`lint` and `npm test` name the closest step, also for wordings from other tools:
`I should see the text "Saved"` → `I see the text "Saved"`. For steps that other tools have and
Plainwright leaves out, such as clicking at a position, they say what to write instead. Every
step is in the [step reference](steps.md). In VS Code, a step that does not exist is underlined
while you type, see [editor support](ide-support.md).
