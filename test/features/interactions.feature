Feature: Interactions

  Background:
    * I open the "Interactions" page

  Scenario: Hovering shows a tooltip
    * I hover over the "Hover over me" element
    * I see the text "Tooltip appeared!"

  Scenario: Double click
    * I double click the "Double click me" button
    * I see the text "Double clicked!"

  Scenario: Right click
    * I right click the "Right click me" element
    * I see the text "Right clicked!"

  Scenario: Scroll to an element
    * I scroll to the "You scrolled all the way down!" element
    * I see the "You scrolled all the way down!" element is in the viewport

  Scenario: Scroll the page
    * I scroll to the bottom of the page
    * I see the "Open Dashboard in new tab" link is in the viewport
    * I scroll to the top of the page
    * I see the "Open Dashboard in new tab" link is not in the viewport

  Scenario: Accept an alert
    * I accept the next dialog
    * I click the "Show Alert" button
    * I see a dialog with the message "This is an alert message"
    * I see the text "alert accepted"

  Scenario: Dismiss a confirm dialog
    * I dismiss the next dialog
    * I click the "Show Confirm" button
    * I see a dialog with the message "Do you confirm?"
    * I see the text "dismissed"

  Scenario: Accept a confirm dialog
    * I accept the next dialog
    * I click the "Show Confirm" button
    * I see the text "confirmed"

  Scenario: Answer a prompt
    * I accept the next dialog with "Hello"
    * I click the "Show Prompt" button
    * I see the text "prompt: Hello"

  Scenario: Dialogs that were not announced are dismissed
    * I click the "Show Prompt" button
    * I see the text "prompt dismissed"

  Scenario: Continue in a tab the page opened
    * I click the "Open Dashboard in new tab" link
    * I see "2" tabs
    * I switch to tab "2"
    * I see the url containing "dashboard.html"
    * I see the "Welcome to your Dashboard" heading
    * I close the current tab
    * I see "1" tab
    * I see the "Interactions Demo" heading

  Scenario: Open an empty tab
    * I open a new tab
    * I see "2" tabs
    * I open the "Login" page
    * I see the "Log in" heading
    * I switch to tab "1"
    * I see the "Interactions Demo" heading

  Scenario: Work inside a frame
    * I switch to the "Greeting" frame
    * I see the text "Hello from iframe!"
    * I fill "Hi" in the "Message" field
    * I see the value "Hi" in the "Message" field
    * I switch to the main frame
    * I see the "Interactions Demo" heading

  Scenario: Press a key in a field
    * I fill "hello" in the "Keyboard input" field
    * I press "Backspace" in the "Keyboard input" field
    * I see the value "hell" in the "Keyboard input" field
