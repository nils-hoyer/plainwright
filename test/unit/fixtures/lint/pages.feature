Feature: Pages

  Scenario: Pages that cannot be opened
    * I open the "Order" page
    * I am on the "Order" page
    * I am on the "Draft" page
    * I fill "{env.PLAINWRIGHT_LINT_UNSET}" in the "Password" field
