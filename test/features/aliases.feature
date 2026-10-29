Feature: Aliases for elements without a usable name

  The "Orders" page definition in test/steps/pages.ts names these elements.

  Background:
    * I open the "Orders" page

  Scenario: A field without a label
    * I fill "1001" in the "Search" field
    * I see the value "1001" in the "Search" field

  Scenario: A button that only shows an icon
    * I click the "Settings icon" button
    * I see the "Settings" dialog
    * I see the text "Nothing to configure yet."
