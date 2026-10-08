Feature: Advanced checks

  Background:
    * I open the "Assertions" page

  Scenario: Exact and partial text
    * I see exactly the text "Hello World" in the "Greeting" section
    * I see the text "some text" in the "Notes" section
    * I do not see the text "completely absent phrase" in the "Notes" section

  Scenario: An empty element
    * I see the "Empty box" section is empty

  Scenario: CSS classes
    * I see the class "bar" on the "Classed element" element
    * I do not see the class "missing" on the "Classed element" element

  Scenario: Count list items
    * I see "3" items in the "Fruits" list

  Scenario: Description and error message for screen readers
    * I see the "Name input" field with the description "This is a hint for the input below."
    * I see the "Required field" field with the error message "This field is required."

  Scenario: Selected options in a list with several choices
    * I see "Green" selected in the "Colors" dropdown
    * I see "Blue" selected in the "Colors" dropdown

  Scenario: Inside and outside the visible part of the page
    * I see the "I am in the viewport" element is in the viewport
    * I see the "Way below the viewport" element is not in the viewport

  Scenario: Page title
    * I see the page title "Assertions Demo"
    * I see the page title containing "Assertions"

  Scenario: Wait longer for an element
    * I see the "Assertions Demo" heading within "10" seconds

  Scenario: Screenshots in the report
    * I take a screenshot
    * I take a screenshot named "Assertions page"
    * I take a screenshot of the "Greeting" section

  Scenario: Compare an element with a stored screenshot
    * I open the "Swatch" page
    * I see the "Blue square" section matches the screenshot "blue-square.png"

  Scenario: Compare the page with a stored screenshot
    * I open the "Swatch" page
    * I see the page matches the screenshot "swatch-page.png"
