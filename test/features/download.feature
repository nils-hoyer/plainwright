Feature: Downloads

  Background:
    * I open the "Download" page

  Scenario: Download a file
    * I download the file with the "Download Test File" button
    * I see the downloaded file "test-download.txt"
    * I see the text "Hello from playwright-bdd-steps!" in the downloaded file

  Scenario: Save the downloaded file
    * I download the file with the "Download Test File" button
    * I save the downloaded file to "test-results/downloads/test-download.txt"
