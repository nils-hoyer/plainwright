Feature: Helpful error messages

  Scenario: A missing element lists the elements the page offers
    * I open the "Login" page
    * I see this step fail with "Buttons on this page: \"Accept Cookies\", \"Log in\".":
      """
      I click the "Log on" button
      """

  Scenario: A missing element names the current page
    * I open the "Login" page
    * I see this step fail with "No \"Log on\" button found on the \"Login\" page.":
      """
      I click the "Log on" button
      """

  Scenario: A misspelled element name gets a suggestion
    * I open the "Login" page
    * I see this step fail with "Did you mean \"Accept Cookies\"?":
      """
      I click the "Accept Cookie" button
      """

  Scenario: An unknown page lists the defined pages
    * I see this step fail with "No page named \"Logon\". Defined pages: \"Account pages\", \"Account settings\"":
      """
      I open the "Logon" page
      """

  Scenario: Text checks compare capitals
    * I open the "Login" page
    * I see the text "Accept Cookies"
    * I do not see the text "accept cookies"
    * I see this step fail with "Similar texts on this page: \"Accept Cookies\"":
      """
      I see the text "accept cookies"
      """

  Scenario: Text checks in an element compare capitals
    * I open the "Login" page
    * I see the text "Accept Cookies" in the "Cookie consent" dialog
    * I see this step fail with "accept cookies":
      """
      I see the text "accept cookies" in the "Cookie consent" dialog
      """

  Scenario: A download check without a download says to click first
    * I open the "Download" page
    * I see this step fail with "Nothing was downloaded. Click the link or button that offers the file first":
      """
      I see the downloaded file "test-download.txt"
      """

  Scenario: An upload whose click fails reports only the click
    * I open the "File upload" page
    * I see this step fail with "locator.click: Timeout":
      """
      I upload the file "test/test-app/test-file.txt" with the "Choose from cloud" button
      """
    * I see the "Choose File" button

  Scenario: Tabs are counted from 1
    * I open the "Login" page
    * I see this step fail with "There is no tab \"0\". Tabs are counted from 1":
      """
      I switch to tab "0"
      """
    * I see this step fail with "There is no tab \"1.5\"":
      """
      I switch to tab "1.5"
      """
    * I see the "Log in" button

  Scenario: A missing element after a click to another page says to switch pages
    * I open the "Dashboard" page
    * I click the "Orders" link
    * I see this step fail with "It is not the address of the \"Dashboard\" page, so the element names defined for it may not fit. When a click led to another page, add I am on the \"Orders\" page before this step.":
      """
      I fill "1001" in the "Search" field
      """

  Scenario: A missing element inside another one lists what that one offers
    * I open the "Orders" page
    * I see this step fail with "No \"Remove\" button found in the \"Order 1001\" row.":
      """
      I click the "Remove" button in the "Order 1001" row
      """
    * I see this step fail with "Buttons in the \"Order 1001\" row: \"Delete\".":
      """
      I click the "Remove" button in the "Order 1001" row
      """

  Scenario: A missing container is named first
    * I open the "Orders" page
    * I see this step fail with "No \"Order 9999\" row found on the \"Orders\" page.":
      """
      I click the "Delete" button in the "Order 9999" row
      """
    * I see this step fail with "Rows on this page: \"Order 1001\", \"Order 1002\".":
      """
      I click the "Delete" button in the "Order 9999" row
      """

  # A backslash keeps the braces for the step inside the doc string.
  Scenario: An unknown value lists the known ones
    * I see this step fail with "No value named \"nothing\" for":
      """
      I fill "\{nothing}" in the "Username" field
      """

  Scenario: A missing part of a value lists what is there
    * I see this step fail with "has no \"email\". It has \"username\", \"password\".":
      """
      I fill "\{users.member.email}" in the "Username" field
      """

  Scenario: A page address with a wildcard cannot be opened
    * I see this step fail with "cannot be opened":
      """
      I open the "Account pages" page
      """

  Scenario: Creating test data fails when the API does
    * I see this step fail with "Creating \"order\" failed. POST /api/nothing answered 404":
      """
      I create "order" at "/api/nothing" with "x"
      """

  Scenario: An element that opens nothing cannot be expanded
    * I open the "Assertions" page
    * I see this step fail with "The \"Greeting\" section does not open or close anything: it has no aria-expanded and is no details element.":
      """
      I see the "Greeting" section is expanded
      """

  Scenario: An element without an address leads nowhere
    * I open the "Assertions" page
    * I see this step fail with "The \"Shipping\" button leads nowhere: it has no href.":
      """
      I see the "Shipping" button leads to "/shipping"
      """
