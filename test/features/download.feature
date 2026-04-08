Feature: Download API (download.steps.ts)

  Background:
    Given I use the page object "download"
    And I navigate to "file:///Users/nilshoyer/dev/playwright-bdd-all/test/test-app/download.html"

  Scenario: Click triggers a successful download
    When I click "btn download" and wait for the download
    Then the download succeeds

  Scenario: Download has the expected suggested filename
    When I click "btn download" and wait for the download
    Then the download filename is "test-download.txt"

  Scenario: Download filename contains partial string
    When I click "btn download" and wait for the download
    Then the download filename contains "test-download"

  Scenario: Download url contains expected scheme
    When I click "btn download" and wait for the download
    Then the download url contains "blob:"
