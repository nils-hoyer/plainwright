Feature: A project step remembers a value

  Scenario: Later steps use the name it remembers
    * I take the number from "Order #10234 was created." as "order"
    * I see the text "Order {order}"
