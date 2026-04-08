Feature: Extended Assertions (assertions.steps.ts)

  Background:
    Given I use the page object "assertions"
    And I navigate to "file:///Users/nilshoyer/dev/playwright-bdd-all/test/test-app/assertions.html"

  # ─── toBeAttached ──────────────────────────────────────────────────────────

  Scenario: Hidden element is attached to the DOM
    Then the "hidden attached" is attached to the DOM

  Scenario: Non-existent element is not attached to the DOM
    Then the "[data-testid='nonexistent-xyz-abc']" is not attached to the DOM

  # ─── toBeEmpty ─────────────────────────────────────────────────────────────

  Scenario: Empty div is empty
    Then the "div empty" is empty

  Scenario: Element with text is not empty
    Then the "text exact" is not empty

  # ─── toBeInViewport ────────────────────────────────────────────────────────

  Scenario: Element in viewport is detected
    Then the "in viewport" is in the viewport

  Scenario: Element far below viewport is not in viewport
    Then the "below viewport" is not in the viewport

  # ─── toHaveText ────────────────────────────────────────────────────────────

  Scenario: Exact text of element matches
    Then the text of "text exact" is "Hello World"

  Scenario: Exact text of element does not match a different string
    Then the text of "text exact" is not "Goodbye World"

  # ─── toContainText ─────────────────────────────────────────────────────────

  Scenario: Element contains partial text
    Then the "text partial" contains the text "some text"

  Scenario: Element does not contain absent text
    Then the "text partial" does not contain the text "completely absent phrase xyz"

  # ─── toHaveClass ───────────────────────────────────────────────────────────

  Scenario: Element has exact class list
    Then the "classed element" has the class "foo bar baz"

  Scenario: Element does not have a different class list
    Then the "classed element" does not have the class "other-class"

  # ─── toContainClass ────────────────────────────────────────────────────────

  Scenario: Element contains a single class among others
    Then the "classed element" contains the class "bar"

  Scenario: Element does not contain an absent class
    Then the "classed element" does not contain the class "missing"

  # ─── toHaveCount ───────────────────────────────────────────────────────────

  Scenario: Selector matches expected number of elements
    Then the ".list-item" has 3 elements

  # ─── toHaveCSS ─────────────────────────────────────────────────────────────

  Scenario: CSS display property of paragraph is block
    Then the CSS property "display" of "text exact" equals "block"

  # ─── toHaveId ──────────────────────────────────────────────────────────────

  Scenario: Element has expected DOM ID
    Then the "input with id" has the ID "my-special-id"

  # ─── toHaveRole ────────────────────────────────────────────────────────────

  Scenario: Button has role button
    Then the "btn role" has the role "button"

  Scenario: Button does not have role link
    Then the "btn role" does not have the role "link"

  # ─── toHaveAccessibleName ──────────────────────────────────────────────────

  Scenario: Element has expected accessible name
    Then the "btn aria label" has the accessible name "Close dialog"

  Scenario: Element does not have a different accessible name
    Then the "btn aria label" does not have the accessible name "Open dialog"

  # ─── toHaveAccessibleDescription ───────────────────────────────────────────

  Scenario: Element has expected accessible description
    Then the "input aria described" has the accessible description "This is a hint for the input below."

  Scenario: Element does not have a different accessible description
    Then the "input aria described" does not have the accessible description "Wrong description text"

  # ─── toHaveAccessibleErrorMessage ──────────────────────────────────────────

  Scenario: Element has expected accessible error message
    Then the "input aria error" has the accessible error message "This field is required."

  Scenario: Element does not have a different accessible error message
    Then the "input aria error" does not have the accessible error message "Wrong error text"

  # ─── toHaveJSProperty ──────────────────────────────────────────────────────

  Scenario: Visible element has JS property hidden=false
    Then the "div visible js" has the JS property "hidden" with value "false"

  # ─── toHaveValues ──────────────────────────────────────────────────────────

  Scenario: Multi-select has expected selected values
    Then the selected values of "select multi" include "green, blue"

  # ─── PageAssertions: toHaveTitle ───────────────────────────────────────────

  Scenario: Page title equals expected string
    Then the page title equals "Assertions Demo"

  Scenario: Page title is not a wrong string
    Then the page title is not "Wrong Page Title"

  Scenario: Page title contains a substring
    Then the page title contains "Assertions"

  # ─── toHaveScreenshot – visual regression ─────────────────────────────────
  # These scenarios require an initial run with --update-snapshots to create
  # the baseline. After that they run as normal comparison tests.

  @snapshot
  Scenario: Locator matches named screenshot
    Then the "text exact" matches the screenshot "text-exact.png"

  @snapshot
  Scenario: Locator matches auto-named snapshot
    Then the "text exact" matches the snapshot

  @snapshot
  Scenario: Page matches named screenshot
    Then the page matches the screenshot "assertions-page.png"

  @snapshot
  Scenario: Page matches auto-named snapshot
    Then the page matches the snapshot
