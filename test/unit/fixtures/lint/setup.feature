Feature: Sessions

  @setup
  Scenario: Log in once
    * I keep the session
    * I keep the session for "@admin" scenarios
    * I keep the session for "admin" scenarios

  Scenario: Not a setup scenario
    * I keep the session
