Feature: Todos

  Scenario Outline: I add the todo "<text>"
    Types the todo into the input and confirms it with Enter.

    * I fill "<text>" in the "What needs to be done?" field
    * I press "Enter" in the "What needs to be done?" field

    Examples:
      | text     |
      | Buy milk |
