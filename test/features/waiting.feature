Feature: Waiting

  A fixed wait is a fallback; every "I see" step already waits. lint warns about it.

  Scenario: A fixed wait
    * I open the "Dashboard" page
    * I wait "1" second
    * I see the "Welcome to your Dashboard" heading
