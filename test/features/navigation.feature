Feature: Pages and navigation

  Given, When and Then are optional. This feature uses them; the others use *.

  Scenario: Open a page by its name
    Given I open the "Login" page
    Then I am on the "Login" page
    And I see the page title "Login"

  Scenario: Go back and forward
    Given I open the "Dashboard" page
    When I click the "Forms Demo" link
    Then I am on the "Forms" page
    When I go back
    Then I am on the "Dashboard" page
    When I go forward
    Then I am on the "Forms" page

  Scenario: Reload the page
    Given I open the "Forms" page
    When I reload the page
    Then I am on the "Forms" page

  Scenario: Open an address and check it
    When I open the url "/dashboard.html"
    Then I see the url "/dashboard.html"
    And I see the url containing "dashboard"
    And I do not see the url containing "login"
    And I see the page title containing "Dash"

  Scenario: Use the element names of a page without opening it
    Given I open the url "/orders.html"
    And I use the page object "Orders"
    When I fill "1001" in the "Search" field
    Then I see the value "1001" in the "Search" field
