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
