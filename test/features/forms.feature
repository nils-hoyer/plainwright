Feature: Forms

  Background:
    Given I use the page object "forms"
    And I navigate to "file:///Users/nilshoyer/dev/playwright-bdd-all/test/test-app/forms.html"

  Scenario: Fill text inputs
    When I fill "Jane Doe" in the "input full name"
    When I fill "jane@example.com" in the "input email"
    Then the value of "input full name" equals "Jane Doe"
    Then the value of "input email" contains "example"

  Scenario: Type alias works like fill
    When I type "John Doe" in the "input full name"
    Then the value of "input full name" equals "John Doe"

  Scenario: Clear an input field
    When I fill "Jane Doe" in the "input full name"
    When I clear the "input full name"
    Then the value of "input full name" is empty

  Scenario: Clear and fill in one step
    When I fill "Old Value" in the "input full name"
    When I clear and fill "New Value" in the "input full name"
    Then the value of "input full name" equals "New Value"

  Scenario: Disabled and read-only field states
    Then the "input disabled" is disabled
    Then the "input readonly" is read-only
    Then the "input full name" is enabled
    Then the "input full name" is editable

  Scenario: Select a dropdown option
    When I select "Germany" in the "select country"
    Then the value of "select country" equals "de"

  Scenario: Select option by index
    When I select the option at index 2 in the "select country"
    Then the value of "select country" equals "at"

  Scenario: Check and uncheck checkboxes
    When I check the "checkbox terms"
    Then the "checkbox terms" is checked
    When I uncheck the "checkbox newsletter"
    Then the "checkbox newsletter" is not checked

  Scenario: Press Enter submits form
    When I fill "Jane Doe" in the "input full name"
    When I fill "jane@example.com" in the "input email"
    When I focus on "btn submit form"
    When I press "Enter" on "btn submit form"
    Then I see the "form result"
    Then I see the text "Form submitted successfully!"

  Scenario: Local storage can be set and read
    When I click the "btn set storage"
    Then local storage "demo_key" equals "demo_value"
    When I click the "btn clear storage"

  Scenario: Focus on input field
    When I focus on "input full name"
    Then the "input full name" is focused
