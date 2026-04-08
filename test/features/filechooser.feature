Feature: FileChooser API (filechooser.steps.ts)

  Background:
    Given I use the page object "filechooser"
    And I navigate to "file:///Users/nilshoyer/dev/playwright-bdd-all/test/test-app/filechooser.html"

  Scenario: Set single file via file chooser dialog
    When I click "btn upload" and set the file "test/test-app/test-file.txt"
    Then I see the text "test-file.txt" in the "file result"

  Scenario: Set multiple files via file chooser dialog
    When I click "btn upload multi" and set the files "test/test-app/test-file.txt, test/test-app/test-file.txt"
    Then I see the text "test-file.txt" in the "file result multi"
