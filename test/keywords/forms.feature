Feature: Forms

  Scenario Outline: I enter the name "<name>"
    Fills the name field on the forms page.

    * I fill "<name>" in the "Full Name" field

    Examples:
      | name     |
      | Jane Doe |

  Scenario: I enter a name in bold
    Angle brackets that are not a parameter of the keyword are text.

    * I fill "<b>Jane</b>" in the "Full Name" field

  Scenario Outline: I enter the contact "<name>" with the email "<email>"
    A table in a keyword, with the values of the keyword in its cells.

    * I fill the fields:
      | Full Name | <name>  |
      | Email     | <email> |

    Examples:
      | name     | email            |
      | Jane Doe | jane@example.com |
