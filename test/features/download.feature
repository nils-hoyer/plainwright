Feature: Downloads

  Background:
    * I open the "Download" page

  Scenario: Download a file
    * I download the file with the "Download Test File" button
    * I see the downloaded file "test-download.txt"
    * I see the text "Hello from playwright-bdd-steps!" in the downloaded file

  Scenario: Upload the downloaded file again, with its own name
    * I download the file with the "Download Test File" button
    * I open the "File upload" page
    * I upload the downloaded file with the "Choose File" button
    * I see the text "test-download.txt" in the "Chosen file" section
