Feature: Drag and Drop (drag.steps.ts)

  Background:
    Given I use the page object "drag"
    And I navigate to "file:///Users/nilshoyer/dev/playwright-bdd-all/test/test-app/drag.html"

  Scenario: Drag element to drop zone using page object references
    When I drag "drag source" to "drop target"
    Then I see the text "Dropped!"

  Scenario: Drag element to drop zone using raw CSS selectors
    When I drag "[data-testid='drag-source']" to "[data-testid='drop-target']"
    Then I see the text "Dropped!"
