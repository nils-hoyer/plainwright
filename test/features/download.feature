Feature: Downloads

  Background:
    * I open the "Download" page

  Scenario: Download a file
    * I download the file with the "Download Test File" button
    * I see the downloaded file "test-download.txt"

  Scenario: Save the downloaded file
    * I download the file with the "Download Test File" button
    * I save the downloaded file to "test-results/downloads/test-download.txt"
