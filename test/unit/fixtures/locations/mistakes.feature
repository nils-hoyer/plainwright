Feature: Mistakes

  Background:
    * I open the "Todos" page

  Scenario: Wrong text
    * I add the todo "Buy milk"
    * I see the text "Buy bread"
