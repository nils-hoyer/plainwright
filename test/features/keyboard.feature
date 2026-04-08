Feature: Extended Keyboard API (keyboard.steps.ts)

  Background:
    Given I use the page object "interactions"
    And I navigate to "file:///Users/nilshoyer/dev/playwright-bdd-all/test/test-app/interactions.html"

  Scenario: keyboard.down and keyboard.up type characters
    When I focus on "input keyboard"
    When I hold down the key "H"
    When I release the key "H"
    When I hold down the key "i"
    When I release the key "i"
    Then the value of "input keyboard" equals "Hi"

  Scenario: Sequential keyboard.down and keyboard.up build a word
    When I focus on "input keyboard"
    When I hold down the key "A"
    When I release the key "A"
    When I hold down the key "b"
    When I release the key "b"
    Then the value of "input keyboard" equals "Ab"

  Scenario: Insert text fires only input event (no clear)
    When I focus on "input keyboard"
    When I insert the text "hello"
    Then the value of "input keyboard" equals "hello"

  Scenario: Insert text appends to existing value
    When I fill "world" in the "input keyboard"
    When I focus on "input keyboard"
    When I insert the text "!"
    Then the value of "input keyboard" equals "world!"
