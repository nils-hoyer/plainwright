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
