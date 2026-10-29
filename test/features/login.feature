Feature: Login

  Background:
    * I open the "Login" page

  Scenario: Successful login
    * I fill "1234567890" in the "Username" field
    * I fill "password123" in the "Password" field
    * I click the "Log in" button
    * I see the text "Welcome back!"

  Scenario: The cookie banner can be accepted
    * I see the "Cookie consent" dialog
    * I click the "Accept Cookies" button
    * I do not see the "Cookie consent" dialog
    * I see the cookie "cookies_accepted"

  Scenario: The log in button is enabled once both fields are valid
    * I see the "Log in" button is disabled
    * I fill "1234567890" in the "Username" field
    * I fill "password123" in the "Password" field
    * I see the "Log in" button is enabled

  Scenario: A short username shows a hint
    * I fill "abc" in the "Username" field
    * I see the text "Your username consists of 10 digits."
    * I see the "Log in" button is disabled

  Scenario: A wrong password shows an error
    * I fill "1234567890" in the "Username" field
    * I fill "wrongpassword" in the "Password" field
    * I click the "Log in" button
    * I see the text "Username and password are incorrect."
    * I do not see the "Welcome back!" dialog

  Scenario: Closing the welcome dialog opens the dashboard
    * I fill "1234567890" in the "Username" field
    * I fill "password123" in the "Password" field
    * I click the "Log in" button
    * I see the "Welcome back!" dialog
    * I click the "Close" button
    * I see the url "/dashboard.html"
    * I see the "Welcome to your Dashboard" heading

  Scenario: There is help for a forgotten password
    * I see the "Forgot password?" link
