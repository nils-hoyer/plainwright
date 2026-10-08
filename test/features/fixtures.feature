Feature: Project fixtures

  test/steps/fixtures.ts extends `test` with a testUser fixture. The step
  "I log in as the test user" (test/steps/account.steps.ts) uses it.

  Scenario: A project step uses a fixture of the project
    * I open the "Login" page
    * I log in as the test user
    * I see the text "Welcome back!"
