Feature: Logged in

  The login is a keyword in the Background, so every scenario of this file starts logged in
  and the reviewer sees who is logged in (docs/logging-in.md).

  Background:
    * I am logged in as "1234567890"

  Scenario: Every scenario of the feature starts logged in
    * I open the "Dashboard" page
    * I see the text "Signed in as 1234567890"

  Scenario: A scenario can log in as another user
    * I log in as "0987654321" with password "admin123"
    * I click the "Close" button
    * I see the url "/dashboard.html"
    * I see the text "Signed in as 0987654321"
