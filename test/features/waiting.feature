Feature: Waiting

  Fixed waits are discouraged; every "I see" step already waits. lint warns about them.

  Scenario: Wait steps
    * I open the "Dashboard" page
    * I wait "1" second
    * I wait "100" milliseconds
    * I wait for the page to load
    * I wait for network idle
    * I see the "Welcome to your Dashboard" heading
