@logged-in
Feature: Logged in once

  These scenarios start with the session that test/setup/login.setup.ts saved once for the
  whole run (project "chromium-logged-in", see docs/logging-in.md).

  Scenario: The dashboard knows who is signed in
    * I open the "Dashboard" page
    * I see the text "Signed in as 1234567890"
