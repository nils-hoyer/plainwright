Feature: Keyboard

  Background:
    * I open the "Interactions" page
    * I focus on the "Keyboard input" field

  Scenario: Hold down and release keys
    * I hold down the key "H"
    * I release the key "H"
    * I hold down the key "i"
    * I release the key "i"
    * I see the value "Hi" in the "Keyboard input" field

  Scenario: Insert text without key presses
    * I insert the text "hello"
    * I see the value "hello" in the "Keyboard input" field

  Scenario: Inserted text is added to the value
    * I fill "world" in the "Keyboard input" field
    * I insert the text "!"
    * I see the value "world!" in the "Keyboard input" field

  Scenario: Press a key combination
    * I fill "hello" in the "Keyboard input" field
    * I press "ControlOrMeta+A"
    * I press "Backspace"
    * I see the "Keyboard input" field is empty
