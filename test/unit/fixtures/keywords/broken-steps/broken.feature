Feature: Broken

  Scenario Outline: I search for "<term>"
    * I open the "Search" page
    * I clik the "Search" button
    * I fill "<query>" in the "Search" field

  Scenario Outline: I sign up as "<name>" with "<email>"
    * I fill "<name>" in the "Name" field
    * I fill "<b>new</b> <nme>" in the "Bio" field

  Scenario Outline: I wait for the report "<ms>" milliseconds
    * I wait "<ms>" milliseconds
