Feature: Values

  Scenario: Known and unknown values
    * I open the "Login" page
    * I fill "{users.admin.email}" in the "Email" field
    * I fill "{users.admin.phone}" in the "Phone" field
    * I fill "{nothing}" in the "Name" field
    * I fill "{env.ANYTHING}" in the "Name" field
    * I fill "\{literal}" in the "Name" field
    * there is an order called "order"
    * I open the url "/orders/{order.id}"
    * I send a "GET" request to "/api/orders"
    * I see the response field "0.id" with the value "{response.0.id}"
    * I remember "x" as "later"
    * I fill "{later}" in the "Name" field
    * I open the "Checkout" page

  Scenario: Values used before they are remembered
    * I fill "{early}" in the "Name" field
    * I remember "x" as "early"
    * I open the url "/orders/{coffee.id}"
    * there is an order called "coffee"

  Scenario: Values remembered in another scenario
    * I fill "{later}" in the "Name" field
    * I fill "{coffee.id}" in the "Name" field

  Scenario Outline: Values remembered in each example
    * I remember "<value>" as "picked"
    * I fill "{picked}" in the "Name" field

    Examples:
      | value |
      | a     |
      | b     |
