Feature: The order of values

  Background:
    * I remember "x" as "shared"

  Scenario: The Background remembers before the scenario
    * I fill "{shared}" in the "Name" field

  Scenario Outline: A name remembered in one example only
    * I remember "<value>" as "<name>"
    * I fill "{picked}" in the "Name" field

    Examples:
      | value | name   |
      | a     | picked |
      | b     | other  |

  Rule: Steps in a rule
    Background:
      * I fill "{shared}" in the "Name" field
      * I fill "{in-rule}" in the "Name" field

    Scenario: The rule's Background uses a value too early
      * I remember "y" as "in-rule"
