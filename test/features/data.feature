Feature: Test data

  Values in quotes can come from data files (test/data), the environment and earlier steps.

  Scenario: Values from a data file
    * I open the "Login" page
    * I fill "{users.member.username}" in the "Username" field
    * I fill "{users.member.password}" in the "Password" field
    * I click the "Log in" button
    * I see the text "Welcome back!"

  Scenario: Values from the environment
    * I open the "Login" page
    * I fill "{users.member.username}" in the "Username" field
    * I fill "{env.PLAINWRIGHT_TEST_PASSWORD}" in the "Password" field
    * I click the "Log in" button
    * I see the text "Welcome back!"

  Scenario: Remembered values, lists and numbers
    * I open the "Forms" page
    * I fill "{users.names.0}" in the "Full Name" field
    * I remember the text of the "Full Name" field as "name"
    * I fill "{name}@example.com" in the "Email" field
    * I see the value "Jane@example.com" in the "Email" field
    * I open the "Assertions" page
    * I see "{cart.count}" items in the "Fruits" list

  Scenario: The same unique value within a test
    * I open the "Forms" page
    * I fill "{unique}" in the "Full Name" field
    * I remember the text of the "Full Name" field as "first"
    * I fill "{unique}" in the "Email" field
    * I see the value "{first}" in the "Email" field

  Scenario: Braces stay as written after a backslash
    * I open the "Forms" page
    * I fill "\{name}" in the "Full Name" field
    * I see the value "\{name}" in the "Full Name" field

  Scenario: Test data created through the API
    * there is an order for "Coffee"
    * I open the "Orders from the API" page
    * I see the text "Coffee" in the "Order {order.id}" row
    * I see the text "new" in the "Order {order.id}" row
    * I see the text "Last updated {today}"

  Scenario: Requests and answers
    * there is an order for "Tea"
    * I send a "PATCH" request to "/api/orders/{order.id}" with "{orders.paid}"
    * I see the response status "200"
    * I see the response field "status" with the value "paid"
    * I send a "GET" request to "/api/orders/{order.id}"
    * I see the response field "item" with the value "Tea"
    * I see the response field "quantity" with the value "2"
    # The order is gone before the test ends; deleting it afterwards still passes.
    * I send a "DELETE" request to "/api/orders/{order.id}"
    * I see the response status "204"

  Scenario: A number from a message, with a step of the project, and the address
    * I open the "Orders from the API" page
    * I fill "Cake" in the "Item" field
    * I click the "Create order" button
    * I am on the "Order" page
    * I remember the text of the "was created" message as "confirmation"
    * I remember the number in "{confirmation}" as "order"
    * I delete "/api/orders/{order}" after the test
    * I see the "Order {order}" heading
    * I remember the url as "order-page"
    * I open the "Orders from the API" page
    * I open the url "{order-page}"
    * I see the "Order {order}" heading
    * I see the text "Item: Cake"

  @german
  Scenario: Dates as the browser writes them
    * I open the "Dates" page
    * I see the text "Today is {today.local}."
    * I fill "{in-7-days}" in the "Delivery date" field
    * I see the text "Delivery on {in-7-days.local}"
