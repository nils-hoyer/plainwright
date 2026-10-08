Feature: Forms

  Scenario Outline: I enter the name "<name>"
    Fills the name field on the forms page.

    * I fill "<name>" in the "Full Name" field

    Examples:
      | name     |
      | Jane Doe |

  Scenario Outline: I enter a name in bold
    Angle brackets that are not a parameter of the keyword are text.

    * I fill "<b>Jane</b>" in the "Full Name" field
