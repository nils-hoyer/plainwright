Feature: Cookies and local storage

  Background:
    * I open the "Forms" page

  Scenario: Local storage written by the page
    * I click the "Set Storage Value" button
    * I see the local storage item "demo_key" with the value "demo_value"

  Scenario: Set local storage
    * I set the local storage item "theme" to "dark"
    * I see the local storage item "theme" with the value "dark"
    * I clear the local storage

  Scenario: Cookies written by the page
    * I click the "Set Cookie" button
    * I see the cookie "demo_cookie" with the value "hello"
    * I click the "Delete Cookie" button
    * I do not see the cookie "demo_cookie"

  Scenario: Set and delete cookies
    * I set the cookie "session" to "abc123"
    * I see the cookie "session" with the value "abc123"
    * I delete the cookie "session"
    * I do not see the cookie "session"

  Scenario: Clear all cookies
    * I set the cookie "first" to "1"
    * I set the cookie "second" to "2"
    * I see the cookie "first"
    * I clear all cookies
    * I do not see the cookie "first"
    * I do not see the cookie "second"

  Scenario: A cookie set on a page in a folder applies to the whole site
    * I open the "Account settings" page
    * I set the cookie "theme" to "dark"
    * I open the "Cookies" page
    * I see the text "theme=dark"
