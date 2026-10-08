Feature: Account

  Scenario Outline: I log in as "<username>" with password "<password>"
    Logs in on the login page.

    * I open the "Login" page
    * I fill "<username>" in the "Username" field
    * I fill "<password>" in the "Password" field
    * I click the "Log in" button

    Examples:
      | username   | password |
      | 1234567890 | secret   |

  Scenario Outline: I wait "<seconds>" seconds for the report
    * I wait "<seconds>" seconds

  Scenario Outline: I am logged in
    * I log in as "1234567890" with password "secret"
