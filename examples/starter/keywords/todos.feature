Feature: Todos

  Scenario Outline: I add the todo "<text>"
    Types the todo into the input and confirms it with Enter.

    * I fill "<text>" in the "What needs to be done?" field
    * I press "Enter" in the "What needs to be done?" field

    Examples:
      | text     |
      | Buy milk |

  Scenario Outline: the app has saved the todos "<todos>"
    Stores the todos in the browser the way the app does, and shows them.

    * I set the local storage item "todos" to "<todos>"
    * I reload the page

    Examples:
      | todos            |
      | {todos.shopping} |
