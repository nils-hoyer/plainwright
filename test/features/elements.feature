Feature: Element types

  Each element type finds every role that inspect lists for it.

  Scenario: An alert dialog is a dialog
    * I open the "Widgets" page
    * I see the "Delete order?" dialog
    * I see the text "This cannot be undone." in the "Delete order?" dialog

  Scenario: Menu items that can be ticked are menu items
    * I open the "Widgets" page
    * I see the "Refresh" menu item
    * I see the "Show grid" menu item
    * I see the "Compact" menu item

  Scenario: Options of a custom dropdown, shown elsewhere on the page
    * I open the "Widgets" page
    * I type "Ge" in the "Country" field
    * I see the "Georgia" option
    * I do not see the "Greece" option
    * I click the "Germany" option
    * I see the value "Germany" in the "Country" field
    * I do not see the "Germany" option

  Scenario: Switches turn on and off
    * I open the "Widgets" page
    * I see the "Dark mode" switch is not checked
    * I check the "Dark mode" switch
    * I see the "Dark mode" switch is checked
    * I uncheck the "Dark mode" switch
    * I see the "Dark mode" switch is not checked
    * I see the "Notifications" switch is checked
    * I uncheck the "Notifications" switch
    * I see the "Notifications" switch is not checked

  Scenario: A name with a part that changes, found by its alias
    * I open the "Widgets" page
    * I see the "Cart" button
    * I see the text "Cart (3)" in the "Cart" button

  Scenario: An SVG with role img is an image
    * I open the "Widgets" page
    * I see the "Company logo" image

  Scenario: Buttons with the same name, told apart by their row
    * I open the "Orders" page
    * I click the "Delete" button in the "Order 1001" row
    * I see the "Order 1001 deleted" message
    * I do not see the "Order 1001" row
    * I see the "Delete" button in the "Order 1002" row

  Scenario: Rows and cells
    * I open the "Orders" page
    * I see the "Order 1002" cell in the "Order 1002" row
    * I see the text "Order 1001" in the "Order 1001" row

  Scenario: List items match the text they contain
    * I open the "Dashboard" page
    * I see the "Savings" list item in the "Accounts" list
    * I see the text "$987.32" in the "Checking" list item
    * I do not see the "Loans" list item
