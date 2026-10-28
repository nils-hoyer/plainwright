Feature: Downloads

  A click on a link or button downloads, like in the browser; the checks wait for the file.

  Background:
    * I open the "Download" page

  Scenario: Download a file with a click
    * I click the "Download Test File" button
    * I see the downloaded file "test-download.txt"
    * I see the text "Hello from playwright-bdd-steps!" in the downloaded file
