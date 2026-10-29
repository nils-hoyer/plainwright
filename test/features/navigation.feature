Feature: Pages and navigation

  Given, When and Then are optional. This feature uses them; the others use *.

  Scenario: Open a page by its name
    Given I open the "Login" page
    Then I see the url "/login.html"
    And I see the page title "Login"

  Scenario: Go back and forward
    Given I open the "Dashboard" page
    When I click the "Forms Demo" link
    Then I see the url "/forms.html"
    When I go back
    Then I see the url "/dashboard.html"
    When I go forward
    Then I see the url "/forms.html"

  Scenario: Reload the page
    Given I open the "Forms" page
    When I reload the page
    Then I see the url "/forms.html"

  Scenario: Open an address and check it
    When I open the url "/dashboard.html"
    Then I see the url "/dashboard.html"
    And I see the url containing "dashboard"
    And I do not see the url containing "login"
    And I see the page title containing "Dash"

  Scenario: Use the element names of a page without opening it
    Given I open the url "/orders.html"
    And I am on the "Orders" page
    When I fill "1001" in the "Search" field
    Then I see the value "1001" in the "Search" field

  Scenario: Use the element names of a page that a click leads to
    Given I open the "Dashboard" page
    When I click the "Orders" link
    And I am on the "Orders" page
    Then I fill "1001" in the "Search" field
    And I see the value "1001" in the "Search" field

  Scenario: Opening an address keeps the current page
    Given I am on the "Orders" page
    When I open the url "/orders.html"
    Then I fill "1001" in the "Search" field
    And I see the value "1001" in the "Search" field
