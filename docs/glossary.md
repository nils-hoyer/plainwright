# Glossary

The words these docs use, in alphabetical order.

**Advanced step.** A step for special cases, such as cookies, tabs or requests to the app's
API. `lint` lists them as info. See [core and advanced](vocabulary.md#core-and-advanced).

**Alias.** A name for an element that shows no usable name, such as an icon-only button,
written in the file of its page in `pages/`. See [pages](pages.md#elements-without-a-name-aliases).

**Background.** Steps at the top of a feature file that run before every scenario of the file,
such as logging in. See [writing tests](writing-tests.md#a-test-is-a-list-of-steps).

**Check.** A step that starts with `I see` or `I do not see`. It waits until the page gets
there, up to 5 seconds. See [checks](writing-tests.md#checks).

**Core step.** One of the everyday steps that every reviewer should know. See the
[step reference](steps.md#core-steps).

**Current page.** The page whose aliases the next steps use. `I open the "…" page` and
`I am on the "…" page` set it. See [the current page](pages.md#the-current-page).

**Data file.** A JSON file in `data/` with values that many tests share, such as users. A step
refers to a value with `{file.key}`. See [test data](test-data.md#data-files).

**Element.** Something on the page that a step names: `the "Log in" button`. Its name is what
the user sees, followed by its type.

**Element type.** The word after the name: `button`, `link`, `field`, `row` and so on. It says
what kind of element is meant. See [elements](writing-tests.md#elements).

**Feature, feature file.** A `.feature` file in `features/`. `Feature:` names the area it
tests, and the file holds its scenarios.

**Fixture.** Three different things, depending on the tool. In Cypress, a fixture is a file of
test data; in Plainwright that is a [data file](test-data.md#data-files). In Playwright, and in
[steps in TypeScript](writing-steps.md#fixtures), a fixture is something a test gets ready
before it starts, such as the browser page or a database connection. Only developers write
those.

**Keyword.** Your own step, made of existing steps, written in a feature file in `keywords/`.
Its title is the new step. See [keywords](keywords.md).

**Page.** A name for one page of the app, in a file in `pages/`, with its address and its
aliases. Pages are optional. See [pages](pages.md).

**Remembered value.** A value a step keeps for the rest of the test, such as the number of a
new order: `I remember the number in "…" as "order"`, then `{order}`. See
[remembering values](test-data.md#remembering-values).

**Report.** The page that shows the last run, with every step, its values and the trace of
each failed test: `npm run report`. See [reading tests](reading-tests.md#opening-the-report).

**Scenario.** One test: a title and its steps.

**Scenario Outline.** A scenario that runs once for every row of its `Examples` table. In
`keywords/`, a scenario outline is a keyword whose values are the `"<name>"` in its title. See
[the same steps with different data](writing-tests.md#the-same-steps-with-different-data).

**Step.** One line of a scenario, starting with `*`, `Given`, `When`, `Then` or `And`. A
built-in step, a keyword, or a step in TypeScript.

**Table.** The lines starting with `|` below a step that ends with a colon, such as
`I fill the fields:`. See [tables below a step](writing-tests.md#tables-below-a-step).

**Tag.** A word with `@` above a feature or scenario, such as `@smoke`, to run some tests
only: `npm test -- --grep @smoke`. See [tags](writing-tests.md#tags).

**Trace.** A replay of a failed test, step by step, with the page as it was at each step. The
report links it.

**Value.** Something in braces inside the quotes of a step, `{users.admin.email}`, filled in
from a data file, the environment or an earlier step. See [test data](test-data.md).
