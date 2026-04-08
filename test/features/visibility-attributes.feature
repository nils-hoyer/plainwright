Feature: Visibility and Attributes

  Background:
    Given I use the page object "dashboard"
    And I navigate to "file:///Users/nilshoyer/dev/playwright-bdd-all/test/test-app/dashboard.html"

  Scenario: Dashboard elements are visible
    Then I see the "heading welcome"
    Then I see the "section overview"
    Then I see the "item savings"
    Then I see the text "Welcome to your Dashboard"
    Then I see the text "Savings"

  Scenario: Disabled button attributes
    Then I see the attribute "disabled" in element "btn disabled"
    Then the "btn disabled" is disabled
    Then the "btn transfer" is enabled

  Scenario: Not see hidden element
    Then I not see the "[data-testid='nonexistent-element-xyz']"

  Scenario: Text content in element  
    Then I see the text "Account Overview" in the "section overview"

  Scenario: Visible element count
    Then 3 elements of ".account-item" are visible

  Scenario: Not see text that does not exist
    Then I not see the text "This text does not exist on the page at all"

  Scenario: Link attributes
    Then I see the "link forms"
    Then the attribute "href" of "link forms" contains "forms.html"
    Then the attribute "href" of "link forms" equals "forms.html"
