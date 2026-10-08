Feature: Keywords

  Keywords are defined in test/keywords/account.feature.

  Scenario: Log in with a keyword
    * I log in as "1234567890" with password "password123"
    * I see the text "Welcome back!"

  Scenario: A keyword that uses another keyword
    * I am logged in as "1234567890"
    * I see the "Welcome to your Dashboard" heading

  Scenario: Values reach the steps of a keyword unchanged
    * I open the "Forms" page
    * I enter the name "C:\Users\jane \"JD\""
    * I see the value "C:\Users\jane \"JD\"" in the "Full Name" field

  Scenario: Angle brackets that are not parameters stay as they are
    * I open the "Forms" page
    * I enter a name in bold
    * I see the value "<b>Jane</b>" in the "Full Name" field
