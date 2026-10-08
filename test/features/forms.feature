Feature: Forms

  Background:
    * I open the "Forms" page

  Scenario: Fill text fields
    * I fill "Jane Doe" in the "Full Name" field
    * I fill "jane@example.com" in the "Email" field
    * I see the value "Jane Doe" in the "Full Name" field
    * I see the value "jane@example.com" in the "Email" field

  Scenario: A field can also be named by its placeholder
    * I fill "Jane Doe" in the "Your name" field
    * I see the value "Jane Doe" in the "Full Name" field

  Scenario: Clear a field
    * I fill "Jane Doe" in the "Full Name" field
    * I clear the "Full Name" field
    * I see the "Full Name" field is empty

  Scenario: Disabled and read-only fields
    * I see the "Disabled Field" field is disabled
    * I see the "Read-only Field" field is read-only
    * I see the "Full Name" field is enabled
    * I see the "Full Name" field is editable

  Scenario: Choose an option in a dropdown
    * I select "Germany" in the "Country" dropdown
    * I see "Germany" selected in the "Country" dropdown
    * I see the value "de" in the "Country" dropdown

  Scenario: Choose an option by its position
    * I select option "3" in the "Country" dropdown
    * I see "Austria" selected in the "Country" dropdown

  Scenario: Tick and untick checkboxes
    * I check the "I accept the terms and conditions" checkbox
    * I see the "I accept the terms and conditions" checkbox is checked
    * I uncheck the "Subscribe to newsletter" checkbox
    * I see the "Subscribe to newsletter" checkbox is not checked

  Scenario: Pressing Enter in a field submits the form
    * I fill "Jane Doe" in the "Full Name" field
    * I press "Enter" in the "Email" field
    * I see the text "Form submitted successfully!"

  Scenario: Submit the form with its button
    * I click the "Submit Form" button
    * I see the text "Form submitted successfully!"

  Scenario: Upload a file in a file field
    * I upload the file "test/test-app/test-file.txt" with the "Upload file" field
    * I see the text "test-file.txt"

  Scenario: Focus a field
    * I focus on the "Full Name" field
    * I see the "Full Name" field is focused
