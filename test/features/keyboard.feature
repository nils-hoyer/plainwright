Feature: Keyboard

  Background:
    * I open the "Interactions" page

  Scenario: Type key by key into a field
    * I type "Hi" in the "Keyboard input" field
    * I see the value "Hi" in the "Keyboard input" field

  Scenario: Typing adds to the value
    * I fill "world" in the "Keyboard input" field
    * I type "!" in the "Keyboard input" field
    * I see the value "world!" in the "Keyboard input" field

  Scenario: Typing adds to the value of a field without the focus
    * I fill "world" in the "Keyboard input" field
    * I focus on the "Open Dashboard in new tab" link
    * I type "!" in the "Keyboard input" field
    * I see the value "world!" in the "Keyboard input" field

  Scenario: Press a key combination
    * I fill "hello" in the "Keyboard input" field
    * I press "ControlOrMeta+A"
    * I press "Backspace"
    * I see the "Keyboard input" field is empty
