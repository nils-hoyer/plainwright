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

  Scenario: An unknown page lists the defined pages
    * I see this step fail with "No page named \"Logon\". Defined pages: \"Login\"":
      """
      I open the "Logon" page
      """

  Scenario: Text checks compare capitals
    * I open the "Login" page
    * I see the text "Accept Cookies"
    * I do not see the text "accept cookies"
    * I see this step fail with "accept cookies":
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
