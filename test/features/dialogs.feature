Feature: Dialogs nobody announced

  "Leave site?" dialogs are accepted, like Playwright does. Other dialogs are dismissed, unless
  a project step answers them itself.

  Scenario: A page with unsaved changes can be left by opening another page
    * I open the "Editor" page
    * I fill "Draft" in the "Notes" field
    * I open the "Dashboard" page
    * I see the "Welcome to your Dashboard" heading

  Scenario: A page with unsaved changes can be left with a link
    * I open the "Editor" page
    * I fill "Draft" in the "Notes" field
    * I click the "Dashboard" link
    * I see the url "/dashboard.html"

  Scenario: A page with unsaved changes can be left by going back
    * I open the "Dashboard" page
    * I open the "Editor" page
    * I fill "Draft" in the "Notes" field
    * I go back
    * I see the url "/dashboard.html"

  Scenario: A project step answers a dialog itself
    * I open the "Interactions" page
    * I answer the prompt of the "Show Prompt" button with "Mine" myself
    * I see the text "prompt: Mine"
    * I see a dialog with the message "Enter something:"
