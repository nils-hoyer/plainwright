@touch
Feature: Touch

  Runs in the chromium-touch project, which enables touch (hasTouch).

  Background:
    * I open the "Touch" page

  Scenario: Tap an element
    * I tap the "Tap me" button
    * I see the text "Tapped!"
