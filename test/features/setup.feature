@setup
Feature: Log in once

  Scenarios tagged @setup run once, before all others (setup: true in playwright.config.ts).
  The sessions they keep are the ones the other scenarios start with (docs/logging-in.md).

  Scenario: Log in for every scenario
    * I am logged in as "1234567890"
    * I keep the session

  Scenario: Log in as the admin for the @admin scenarios
    * I log in as "0987654321" with password "admin123"
    * I click the "Close" button
    * I see the url "/dashboard.html"
    * I keep the session for "@admin" scenarios
