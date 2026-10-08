Feature: Element types

  Each element type finds every role that inspect lists for it.

  Background:
    * I open the "Widgets" page

  Scenario: An alert dialog is a dialog
    * I see the "Delete order?" dialog
    * I see the text "This cannot be undone." in the "Delete order?" dialog

  Scenario: Menu items that can be ticked are menu items
    * I see the "Refresh" menu item
    * I see the "Show grid" menu item
    * I see the "Compact" menu item

  Scenario: An SVG with role img is an image
    * I see the "Company logo" image
