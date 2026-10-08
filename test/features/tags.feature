Feature: Steps for some tags only

  A step file in a folder named after a tag (test/steps/@guest/) applies only to scenarios
  with that tag. Both folders define "I open the start page".

  @guest
  Scenario: Guests start on the login page
    * I open the start page
    * I see the "Log in" button

  @member
  Scenario: Members start on the dashboard
    * I open the start page
    * I see the "Welcome to your Dashboard" heading
