Feature: Interactions

  Background:
    Given I use the page object "interactions"
    And I navigate to "file:///Users/nilshoyer/dev/playwright-bdd-all/test/test-app/interactions.html"

  Scenario: Hover shows tooltip
    When I hover over "hover target"
    Then I see the "hover tooltip"
    Then I see the text "Tooltip appeared!"

  Scenario: Double click triggers event
    When I double click the "btn double click"
    Then I see the "double click result"
    Then I see the text "Double clicked!"

  Scenario: Right click triggers event
    When I right click the "right click target"
    Then I see the "right click result"

  Scenario: Scroll to element at bottom of page
    When I scroll to "scroll target"
    Then I see the "scroll target"

  Scenario: Scroll to bottom and back to top of page
    When I scroll to the bottom of the page
    Then I see the "scroll target"
    When I scroll to the top of the page

  Scenario: Keyboard input in text field
    When I focus on "input keyboard"
    When I type the text "Hello BDD!"
    Then the value of "input keyboard" equals "Hello BDD!"

  Scenario: Press key on element
    When I fill "hello" in the "input keyboard"
    When I press "Backspace" on "input keyboard"
    Then the value of "input keyboard" equals "hell"

  Scenario: Wait steps work correctly
    When I wait 1 seconds
    Then I see the "hover target"

  Scenario: Wait for element to be visible
    When I wait for the element "hover target" to be visible
    Then I see the "hover target"

  Scenario: Element visibility and count assertions
    Then I see the "[data-testid='hover-target']"
    Then I not see the "[data-testid='double-click-result']"
