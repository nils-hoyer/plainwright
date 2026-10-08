Feature: Todo list

  Background:
    * I open the "Todos" page

  Scenario: Add a todo
    * I add the todo "Buy milk"
    * I see the text "Buy milk" in the "Todo items" list
    * I see the text "1 item left"

  Scenario: Complete a todo
    * I add the todo "Buy milk"
    * I add the todo "Walk the dog"
    * I complete the todo "Buy milk"
    * I see the text "1 item left"
    * I click the "Completed" link
    * I see "1" item in the "Todo items" list
    * I see the text "Buy milk" in the "Todo items" list

  Scenario: Clear completed todos
    * I add the todo "Buy milk"
    * I complete the todo "Buy milk"
    * I click the "Clear completed" button
    * I do not see the text "Buy milk"
