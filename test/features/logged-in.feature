Feature: Logged in once

  These scenarios start with a session that test/features/setup.feature kept once for the
  whole run (setup: true in playwright.config.ts, see docs/logging-in.md).

  Background:
    * I open the "Dashboard" page

  Scenario: Every scenario starts logged in
    * I see the text "Signed in as 1234567890"

  @admin
  Scenario: Scenarios with a tag start with the session kept for it
    * I see the text "Signed in as 0987654321"

  @logged-out
  Scenario: Scenarios tagged @logged-out start without a session
    * I see the text "Not signed in"
