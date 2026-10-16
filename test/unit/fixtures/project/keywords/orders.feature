Feature: Orders

  Scenario Outline: there is an order called "<name>"
    * I create "<name>" at "/api/orders" with "{shop.products.coffee}"

    Examples:
      | name  |
      | order |
