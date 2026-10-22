Feature: Mouse

  Drawing with the mouse, such as a signature, needs a step in TypeScript.
  test/steps/drawing.steps.ts is the example from docs/writing-steps.md.

  Scenario: Draw a line across an element
    * I open the "Mouse" page
    * I draw a line across the "Mouse Target Area" element
    * I see the text "mousedown:0" in the "Last mouse down" section
    * I see the text "mouseup:0" in the "Last mouse up" section
