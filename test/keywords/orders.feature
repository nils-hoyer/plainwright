Feature: Orders

  Scenario Outline: there is an order for "<item>"
    Creates an order through the API and deletes it after the test.

    * I remember "<item>" as "item"
    * I create "order" at "/api/orders" with "{orders.new}"
    * I delete "/api/orders/{order.id}" after the test

    Examples:
      | item   |
      | Coffee |
