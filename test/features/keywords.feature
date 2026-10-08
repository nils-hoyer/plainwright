Feature: Keywords

  Keywords are defined in test/keywords/account.feature.

  Scenario: Log in with a keyword
    * I log in as "1234567890" with password "password123"
    * I see the text "Welcome back!"

  Scenario: A keyword that uses another keyword
    * I am logged in as "1234567890"
    * I see the "Welcome to your Dashboard" heading
