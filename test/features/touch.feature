@touch
Feature: Touchscreen API (touchscreen.steps.ts)

  Background:
    Given I use the page object "touch"
    And I navigate to "file:///Users/nilshoyer/dev/playwright-bdd-all/test/test-app/touch.html"

  Scenario: Tap on element by page object reference
    When I tap on "tap target"
    Then I see the "tap result"

  Scenario: Tap at absolute coordinates triggers click event
    When I tap at 300 200
    Then I see the "anywhere result"
