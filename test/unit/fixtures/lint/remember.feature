Feature: Remembered names

  Scenario: Names with spaces cannot be used in braces
    * I remember the text of the "Order number" cell as "order number"
    * I remember the text of the "Order number" cell as "order-number"
    * I see the text "{order-number}"
