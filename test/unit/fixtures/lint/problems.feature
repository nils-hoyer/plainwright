Feature: Problems

  Scenario Outline: Lint finds problems
    * I open the url "https://example.com/login"
    * I click the "#submit" button
    * I clik the "Log in" button
    * I fill "<value>" in the "[data-testid='username']" field
    * I wait "2" seconds
    * I focus on the "Full Name" field
    * I click the "Delete" button in the ".order-row" row
    * I click the "Log in" button

    Examples:
      | value |
      | a     |
      | b     |
