Feature: Login

  Background:
    Given I use the page object "login"
    And I navigate to "file:///Users/nilshoyer/dev/playwright-bdd-all/test/test-app/login.html"

  Scenario: Cookie banner is visible and can be dismissed
    Then I see the "[data-testid='btn-accept-cookies']"
    When I click the "btn accept cookies"
    Then I not see the "btn accept cookies"

  Scenario: Submit button is disabled until valid credentials are entered
    Then the "btn submit" is disabled
    When I fill "1234567890" in the "input username"
    When I fill "password123" in the "input password"
    Then the "btn submit" is enabled

  Scenario: Username hint appears for invalid username format
    When I fill "abc" in the "input username"
    Then I see the "hint username"
    Then I see the text "Your username consists of 10 digits."
    Then the "btn submit" is disabled

  Scenario: Successful login shows welcome modal
    When I fill "1234567890" in the "input username"
    When I fill "password123" in the "input password"
    When I click the "btn submit"
    Then I see the "btn close modal"
    Then I see the text "Welcome back!"

  Scenario: Failed login shows error message
    When I fill "1234567890" in the "input username"
    When I fill "wrongpassword" in the "input password"
    When I click the "btn submit"
    Then I see the text "Username and password are incorrect."
    Then I not see the "btn close modal"

  Scenario: Forgot password link is visible
    Then I see the "link forgot password"
    Then the attribute "href" of "link forgot password" contains "#"

  Scenario: Login and navigate to dashboard
    When I fill "1234567890" in the "input username"
    When I fill "password123" in the "input password"
    When I click the "btn submit"
    Then I see the "btn close modal"
    When I click the "btn close modal"
    Then I not see the "btn close modal"
