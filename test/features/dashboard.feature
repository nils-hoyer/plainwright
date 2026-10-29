Feature: Dashboard

  Background:
    * I open the "Dashboard" page

  Scenario: The overview shows all accounts
    * I see the "Welcome to your Dashboard" heading
    * I see the "Account Overview" section
    * I see the text "Savings" in the "Account Overview" section
    * I see "3" items in the "Accounts" list
    * I do not see the text "Loans" in the "Account Overview" section

  Scenario: An action that is not ready yet is disabled
    * I see the "Coming Soon" button is disabled
    * I see the "Transfer Money" button is enabled

  Scenario: Nobody is signed in without logging in
    * I see the text "Not signed in"

  Scenario: Things that are not on the page
    * I do not see the text "This text does not exist on the page at all"
    * I do not see the "Delete account" button

  Scenario: Links to the demo pages
    * I see the "Forms Demo" link
    * I see the "Forms Demo" link leads to "/forms.html"
