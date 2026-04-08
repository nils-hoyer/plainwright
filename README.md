# playwright-bdd-steps

Pre-built BDD step definitions for [Playwright](https://playwright.dev/) via the [`playwright-bdd`](https://github.com/vitalets/playwright-bdd) package. Write E2E tests in Gherkin without implementing step definitions yourself.

## Installation

```bash
npm install --save-dev playwright-bdd-steps @playwright/test playwright-bdd
npx playwright install
```

## Setup

### 1. Create a Page Object

Extend `BasePage` and define element selectors as camelCase properties:

```typescript
// pages/MyPage.ts
import { BasePage } from 'playwright-bdd-steps';

export class MyPage extends BasePage {
  buttonSubmit = '[data-testid="submit"]';
  inputUsername = '#username';
  inputPassword = '#password';
  errorMessage = '.error-message';
}
```

### 2. Create a fixtures file

Extend the base fixture and register your page objects:

```typescript
// fixtures.ts
import { test as bddBase } from 'playwright-bdd-steps';
import { createBdd } from 'playwright-bdd';
import { MyPage } from './pages/MyPage';

export const test = bddBase.extend<{}>({
  world: async ({ world }, use) => {
    world.registerPageObject('mypage', new MyPage());
    await use(world);
  },
});

export const { Given, When, Then } = createBdd(test);
```

### 3. Configure Playwright

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

const testDir = defineBddConfig({
  features: 'features/**/*.feature',
  steps: ['features/**/*.ts', 'fixtures.ts'],
  importTestFrom: 'fixtures.ts',
  disableWarnings: { importTestFrom: true },
});

export default defineConfig({
  testDir,
  use: { headless: true },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
```

### 4. Write feature files

```gherkin
# features/login.feature
Feature: Login

  Background:
    Given I use the page object "mypage"
    And I navigate to "https://example.com/login"

  Scenario: Successful login
    When I fill "user@example.com" in the "input username"
    And I fill "secret123" in the "input password"
    And I click the "button submit"
    Then I see the url "https://example.com/dashboard"

  Scenario: Failed login shows error
    When I fill "user@example.com" in the "input username"
    And I fill "wrongpassword" in the "input password"
    And I click the "button submit"
    Then I see the "error message"
```

### 5. Run tests

```bash
npx bddgen && npx playwright test
```

## How element resolution works

Every step that interacts with an element accepts a **reference** string, resolved in this order:

1. **Raw selector** – Used as-is when the reference starts with `/`, `.`, `#`, `[`, `text=`, `role=`, `xpath=`, `css=`, or `id=`.

   ```gherkin
   When I click the "#submit-button"
   When I click the ".nav-item"
   ```

2. **Page-object label** – A space-separated name is converted to camelCase and looked up as a property on the active page object.

   ```gherkin
   When I click the "button submit"
   # → looks up buttonSubmit on the active page object
   ```

3. **Page-object with context** – Use `>` to target a specific page object by name.

   ```gherkin
   When I click the "login > button submit"
   # → looks up buttonSubmit on the page object registered as "login"
   ```

## Available Steps

### Navigation

| Step | Example |
|---|---|
| `Given/When I navigate to {string}` | `When I navigate to "https://example.com"` |
| `When I visit the url {string}` | `When I visit the url "/login"` |
| `When I go back` | |
| `When I go forward` | |
| `When I reload the page` | |
| `When I wait for the page to load` | |
| `When I wait for network idle` | |
| `When I wait for the url {string}` | `When I wait for the url "/dashboard"` |
| `Then I see the url {string}` | `Then I see the url "https://example.com"` |
| `Then the url contains {string}` | `Then the url contains "/dashboard"` |
| `Then the url does not contain {string}` | |

### Page Object

| Step | Example |
|---|---|
| `Given/When I use the page object {string}` | `Given I use the page object "login"` |

### Click & Mouse

| Step | Example |
|---|---|
| `When I click the {string}` | `When I click the "button submit"` |
| `When I double click the {string}` | |
| `When I right click the {string}` | |
| `When I hover over {string}` | |
| `When I focus on {string}` | |
| `When I click the text {string}` | `When I click the text "Submit"` |
| `When I click the button {string}` | `When I click the button "OK"` |
| `When I click the link {string}` | `When I click the link "Home"` |

### Form

| Step | Example |
|---|---|
| `When I fill {string} in the {string}` | `When I fill "hello@test.com" in the "input email"` |
| `When I type {string} in the {string}` | *(alias for fill)* |
| `When I clear the {string}` | |
| `When I clear and fill {string} in the {string}` | |
| `When I check the {string}` | |
| `When I uncheck the {string}` | |
| `When I select {string} in the {string}` | `When I select "Germany" in the "select country"` |
| `When I select the option at index {int} in the {string}` | `When I select the option at index 2 in the "select country"` |
| `When I upload the file {string} to {string}` | |
| `When I press {string}` | `When I press "Enter"` |
| `When I press {string} on {string}` | `When I press "Tab" on "input email"` |

### Visibility

| Step | Example |
|---|---|
| `Then I see the {string}` | `Then I see the "button submit"` |
| `Then I not see the {string}` | |
| `Then I see the text {string}` | `Then I see the text "Welcome"` |
| `Then I not see the text {string}` | |
| `Then I see the text {string} in the {string}` | `Then I see the text "Overview" in the "section header"` |
| `Then {int} elements of {string} are visible` | `Then 3 elements of ".item" are visible` |

### Attributes & State

| Step | Example |
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

| Step | Example |
|---|---|
| `When I scroll to the bottom of the page` | |
| `When I scroll to the top of the page` | |
| `When I scroll to {string}` | `When I scroll to "section results"` |
| `When I scroll {string} by {int} pixels` | `When I scroll "down" by 500 pixels` |

### Wait

| Step | Example |
|---|---|
| `When I wait {int} seconds` | `When I wait 2 seconds` |
| `When I wait {int} milliseconds` | |
| `When I wait for the element {string} to be visible` | |
| `When I wait for the element {string} to be hidden` | |
| `When I wait for the element {string} to be enabled` | |
| `Then the element {string} is visible within {int} seconds` | |
| `Then the element {string} is hidden within {int} seconds` | |

### Tabs

| Step | Example |
|---|---|
| `When I open a new tab` | |
| `When I switch to tab {int}` | `When I switch to tab 2` |
| `When I close the current tab` | |
| `Then {int} tabs are open` | `Then 2 tabs are open` |

### Dialogs

| Step | Example |
|---|---|
| `When I accept the dialog` | |
| `When I dismiss the dialog` | |
| `When I accept the dialog with text {string}` | `When I accept the dialog with text "My input"` |
| `Then a dialog with message {string} is shown` | |

### Screenshot

| Step | Example |
|---|---|
| `When I take a screenshot` | |
| `When I take a screenshot named {string}` | `When I take a screenshot named "login-page"` |
| `When I take a screenshot of {string}` | `When I take a screenshot of "section header"` |

### Keyboard

| Step | Example |
|---|---|
| `When I type the text {string}` | `When I type the text "Hello World"` |
| `When I press the key {string}` | `When I press the key "Escape"` |

### Frames

| Step | Example |
|---|---|
| `When I switch to frame {string}` | `When I switch to frame "#my-iframe"` |
| `When I switch to the main frame` | |

### Cookies & Storage

| Step | Example |
|---|---|
| `When I set the cookie {string} to {string}` | `When I set the cookie "session" to "abc123"` |
| `When I delete the cookie {string}` | |
| `When I clear all cookies` | |
| `When I set local storage {string} to {string}` | |
| `When I clear local storage` | |
| `Then the cookie {string} exists` | |
| `Then the cookie {string} does not exist` | |
| `Then the cookie {string} has value {string}` | |
| `Then local storage {string} equals {string}` | |

## Contributing

1. Create a project issue with a proper description and expected behaviour
2. Run `npm run verify` locally — it must pass before submitting a PR
3. Provide a PR with implementation and tests covering the new behaviour

`npm run verify` runs: format check → TypeScript lint → all E2E tests.
