Feature: Navigation

  Scenario: Navigate to login page and check URL
    When I navigate to "file:///Users/nilshoyer/dev/playwright-bdd-all/test/test-app/login.html"
    Then the url contains "login.html"

  Scenario: Navigate to dashboard and back
    When I navigate to "file:///Users/nilshoyer/dev/playwright-bdd-all/test/test-app/login.html"
    When I navigate to "file:///Users/nilshoyer/dev/playwright-bdd-all/test/test-app/dashboard.html"
    Then the url contains "dashboard.html"
    When I go back
    Then the url contains "login.html"

  Scenario: Reload the page
    When I navigate to "file:///Users/nilshoyer/dev/playwright-bdd-all/test/test-app/login.html"
    When I reload the page
    Then the url contains "login.html"

  Scenario: URL does not contain wrong path
    When I navigate to "file:///Users/nilshoyer/dev/playwright-bdd-all/test/test-app/login.html"
    Then the url does not contain "dashboard.html"

  Scenario: Wait for page to load
    When I navigate to "file:///Users/nilshoyer/dev/playwright-bdd-all/test/test-app/dashboard.html"
    When I wait for the page to load
    Then the url contains "dashboard.html"
