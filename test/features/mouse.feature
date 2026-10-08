Feature: Mouse

  Background:
    * I open the "Mouse" page

  Scenario: Click at a position
    * I click at x "200" y "150"
    * I see the text "click" in the "Last event" section

  Scenario: Double click at a position
    * I double click at x "200" y "150"
    * I see the text "dblclick" in the "Last event" section

  Scenario: Right click at a position
    * I right click at x "200" y "150"
    * I see the text "mousedown:2" in the "Last mouse down" section

  Scenario: Move the mouse
    * I move the mouse to x "200" y "150"
    * I see the text "mousemove" in the "Last event" section

  Scenario: Press and release the mouse button
    * I move the mouse to x "200" y "150"
    * I press the mouse button
    * I see the text "mousedown:0" in the "Last mouse down" section
    * I release the mouse button
    * I see the text "mouseup:0" in the "Last mouse up" section

  Scenario: Press a specific mouse button
    * I move the mouse to x "200" y "150"
    * I press the "left" mouse button
    * I see the text "mousedown:0" in the "Last mouse down" section
    * I release the mouse button

  Scenario: Turn the mouse wheel
    * I scroll the mouse wheel by x "0" y "100"
    * I see the text "wheel" in the "Last event" section
