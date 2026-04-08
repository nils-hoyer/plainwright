# playwright-bdd-steps – Copilot Instructions

This project provides **pre-built BDD step definitions** for Playwright via the `playwright-bdd` package.
All steps follow the Gherkin syntax and cover the most common browser interactions so that users can write E2E tests without implementing step definitions.

## Architecture

```
src/
├── fixtures/world.ts      # Extended Playwright test fixture (world = page-object registry + resolver)
├── pages/BasePage.ts       # Base class for Page Objects – selectors as string properties
├── steps/                  # Step definitions (one file per category)
│   ├── navigation.steps.ts
│   ├── pageobject.steps.ts
│   ├── click.steps.ts
│   ├── form.steps.ts
│   ├── visibility.steps.ts
│   ├── attributes.steps.ts
│   ├── scroll.steps.ts
│   ├── wait.steps.ts
│   ├── tabs.steps.ts
│   ├── dialogs.steps.ts
│   ├── screenshot.steps.ts
│   ├── keyboard.steps.ts
│   ├── frames.steps.ts
│   └── storage.steps.ts
├── utils/selector.ts       # Converts BDD labels → selectors (raw or via page object)
└── index.ts                # Re-exports everything & auto-registers all steps
```

## How element resolution works

Every step that interacts with an element takes a `{string}` parameter called **reference**. It is resolved as follows:

1. **Raw selector** – If the reference starts with `/`, `.`, `#`, `[`, `text=`, `role=`, `xpath=`, `css=`, or `id=` it is used as-is.
   Example: `When I click the "#submit"`

2. **Page-object label** – A space-separated name is converted to camelCase and looked up as a property on the *active* page object.
   Example: `When I click the "button login"` → looks up `buttonLogin` on the currently active page object.

3. **Page-object with context** – Use `>` to specify a page object: `"pageName > element label"`.
   Example: `When I click the "login > button login"` → looks up `buttonLogin` on the page object registered as `"login"`.

## Available step patterns (reference)

### Navigation
| Pattern | Example |
|---|---|
| `Given/When I navigate to {string}` | `When I navigate to "https://example.com"` |
| `When I visit the url {string}` | `When I visit the url "/login"` |
| `When I go back` | |
| `When I go forward` | |
| `When I reload the page` | |
| `When I wait for the page to load` | |
| `When I wait for network idle` | |
| `When I wait for the url {string}` | |
| `Then I see the url {string}` | |
| `Then the url contains {string}` | |
| `Then the url does not contain {string}` | |

### Page Object
| Pattern | Example |
|---|---|
| `Given/When I use the page object {string}` | `Given I use the page object "login"` |

### Click & Mouse
| Pattern | Example |
|---|---|
| `When I click the {string}` | `When I click the "button login"` |
| `When I double click the {string}` | |
| `When I right click the {string}` | |
| `When I hover over {string}` | |
| `When I focus on {string}` | |
| `When I click the text {string}` | `When I click the text "Submit"` |
| `When I click the button {string}` | `When I click the button "OK"` |
| `When I click the link {string}` | `When I click the link "Home"` |

### Form
| Pattern | Example |
|---|---|
| `When I fill {string} in the {string}` | `When I fill "hello@test.com" in the "input email"` |
| `When I type {string} in the {string}` | (alias for fill) |
| `When I clear the {string}` | |
| `When I clear and fill {string} in the {string}` | |
| `When I check the {string}` | |
| `When I uncheck the {string}` | |
| `When I select {string} in the {string}` | `When I select "Germany" in the "select country"` |
| `When I select the option at index {int} in the {string}` | |
| `When I upload the file {string} to {string}` | |
| `When I press {string}` | `When I press "Enter"` |
| `When I press {string} on {string}` | `When I press "Tab" on "input email"` |

### Visibility
| Pattern | Example |
|---|---|
| `Then I see the {string}` | `Then I see the "button login"` |
| `Then I do not see the {string}` | |
| `Then I see the text {string}` | `Then I see the text "Welcome"` |
| `Then I do not see the text {string}` | |
| `Then I see the text {string} in the {string}` | |
| `Then {int} elements of {string} are visible` | `Then 3 elements of ".item" are visible` |

### Attributes & State
| Pattern | Example |
|---|---|
| `Then I see the attribute {string} in element {string}` | |
| `Then I not see the attribute {string} in element {string}` | |
| `Then the attribute {string} of {string} equals {string}` | |
| `Then the attribute {string} of {string} contains {string}` | |
| `Then the value of {string} equals {string}` | |
| `Then the value of {string} contains {string}` | |
| `Then the value of {string} is empty` | |
| `Then the {string} is disabled` | |
| `Then the {string} is enabled` | |
| `Then the {string} is checked` | |
| `Then the {string} is not checked` | |
| `Then the {string} is focused` | |
| `Then the {string} is editable` | |
| `Then the {string} is read-only` | |

### Scroll
| Pattern | Example |
|---|---|
| `When I scroll to the bottom of the page` | |
| `When I scroll to the top of the page` | |
| `When I scroll to {string}` | `When I scroll to "section results"` |
| `When I scroll {string} by {int} pixels` | `When I scroll "down" by 500 pixels` |

### Wait
| Pattern | Example |
|---|---|
| `When I wait {int} seconds` | `When I wait 2 seconds` |
| `When I wait {int} milliseconds` | |
| `When I wait for the element {string} to be visible` | |
| `When I wait for the element {string} to be hidden` | |
| `When I wait for the element {string} to be enabled` | |
| `Then the element {string} is visible within {int} seconds` | |
| `Then the element {string} is hidden within {int} seconds` | |

### Tabs
| Pattern | Example |
|---|---|
| `When I open a new tab` | |
| `When I switch to tab {int}` | |
| `When I close the current tab` | |
| `Then {int} tabs are open` | |

### Dialogs
| Pattern | Example |
|---|---|
| `When I accept the dialog` | |
| `When I dismiss the dialog` | |
| `When I accept the dialog with text {string}` | |
| `Then a dialog with message {string} is shown` | |

### Screenshot
| Pattern | Example |
|---|---|
| `When I take a screenshot` | |
| `When I take a screenshot named {string}` | |
| `When I take a screenshot of {string}` | |

### Keyboard
| Pattern | Example |
|---|---|
| `When I type the text {string}` | *(keyboard simulation, no clear)* |
| `When I press the key {string}` | |

### Frames
| Pattern | Example |
|---|---|
| `When I switch to frame {string}` | |
| `When I switch to the main frame` | |

### Cookies & Storage
| Pattern | Example |
|---|---|
| `When I set the cookie {string} to {string}` | |
| `When I delete the cookie {string}` | |
| `When I clear all cookies` | |
| `When I set local storage {string} to {string}` | |
| `When I clear local storage` | |
| `Then the cookie {string} exists` | |
| `Then the cookie {string} does not exist` | |
| `Then the cookie {string} has value {string}` | |
| `Then local storage {string} equals {string}` | |

## How to create a new test

1. **Create a Page Object** – extend `BasePage` and define selectors as camelCase properties:

```typescript
import { BasePage } from 'playwright-bdd-steps';

export class MyPage extends BasePage {
  buttonSubmit = '[data-testid="submit"]';
  inputSearch  = '#search';
}
```

2. **Register the page object** in your fixtures file:

```typescript
import { test as bddBase } from 'playwright-bdd-steps';
import { createBdd } from 'playwright-bdd';
import { MyPage } from './pages/MyPage';

export const test = bddBase.extend({
  world: async ({ world }, use) => {
    world.registerPageObject('mypage', new MyPage());
    await use(world);
  },
});

export const { Given, When, Then } = createBdd(test);
```

3. **Write a .feature file**:

```gherkin
Feature: My Feature

  Background:
    Given I use the page object "mypage"
    And I navigate to "https://example.com"

  Scenario: Search for something
    When I fill "Playwright BDD" in the "input search"
    When I click the "button submit"
    Then I see the text "Results for"
```

4. **Run tests**: `npm run test`

## Key conventions

- Step pattern strings are **exact matches** – use the patterns from the table above.
- Page object property names use **camelCase** (`buttonLogin`, `inputEmail`).
- In BDD steps, element names use **space-separated lowercase** (`"button login"`, `"input email"`).
- Always set the active page object with `Given I use the page object "..."` before using element labels.
- Raw selectors (CSS, XPath) can be used directly in any step without a page object.
