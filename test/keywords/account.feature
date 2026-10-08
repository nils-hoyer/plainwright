Feature: Account

  Scenario Outline: I log in as "<username>" with password "<password>"
    Opens the login page and logs in with the username and password.

    * I open the "Login" page
    * I fill "<username>" in the "Username" field
    * I fill "<password>" in the "Password" field
    * I click the "Log in" button

    Examples:
      | username   | password    |
      | 1234567890 | password123 |

  Scenario Outline: I am logged in as "<username>"
    Logs in with the standard test password and opens the dashboard.

    * I log in as "<username>" with password "password123"
    * I click the "Close" button
    * I am on the "Dashboard" page

    Examples:
      | username   |
      | 1234567890 |
