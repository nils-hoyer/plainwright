Feature: File upload

  Background:
    * I open the "File upload" page

  Scenario: Choose a file with a button that opens the file dialog
    * I upload the file "test/test-app/test-file.txt" with the "Choose File" button
    * I see the text "test-file.txt" in the "Chosen file" section

  Scenario: Choose several files
    * I upload the files "test/test-app/test-file.txt, test/test-app/test-file.txt" with the "Choose Multiple Files" button
    * I see the text "test-file.txt, test-file.txt" in the "Chosen files" section
