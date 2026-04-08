Feature: Mouse API (mouse.steps.ts)

  Background:
    Given I use the page object "mouse"
    And I navigate to "file:///Users/nilshoyer/dev/playwright-bdd-all/test/test-app/mouse.html"

  Scenario: Left click at coordinates is captured
    When I click at position 200 150
    Then I see the text "click" in the "last event"

  Scenario: Double click at coordinates is captured
    When I double click at position 200 150
    Then I see the text "dblclick" in the "last event"

  Scenario: Right click at coordinates is captured
    When I right click at position 200 150
    Then I see the text "mousedown:2" in the "last mousedown"

  Scenario: Mouse move is captured
    When I move the mouse to 200 150
    Then I see the text "mousemove" in the "last event"

  Scenario: Mouse down and up sequence is captured
    When I move the mouse to 200 150
    When I press the mouse button
    Then I see the text "mousedown:0" in the "last mousedown"
    When I release the mouse button
    Then I see the text "mouseup:0" in the "last mouseup"

  Scenario: Specific mouse button press is captured
    When I move the mouse to 200 150
    When I press the "left" mouse button
    Then I see the text "mousedown:0" in the "last mousedown"
    When I release the mouse button
    Then I see the text "mouseup:0" in the "last mouseup"

  Scenario: Mouse wheel scroll is captured
    When I scroll the mouse wheel by 0 and 100
    Then I see the text "wheel" in the "last event"
