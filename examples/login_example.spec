# Feature: login - login

## Scenario: login with correct credentials

* Given I am a registered user
* When I visit the url "/de/register/sign-in"
* Then I see the page "login"
* When I click the "button confirm cookies"
* When I type "0001000699" in the "input user"
* When I type "Hallo12!" in the "input password"
* When I click the "button login"
* Then I see the page "account overview"
* Then I see the url "/de"
* When I click the "button close modal"
* Then I not see the "button close modal"
* Then I see the "overview credit card"

## Scenario: login with incorrect user name

* Given I visit the page login
* When I type "0000000000" in the "input user"
* When I type "Hallo12!" in the "input password"
* When I click the "button login"
* Then I see the text "Benutzerkennung und Passwort ist falsch"

## Scenario: login with invalid user name

* Given I visit the page login
* When I type "01234567890" in the "input user"
* Then I see the text "Ihre Benutzerkennung besteht aus 10 Zahlen."
* Then I see the attribute "disabled" in element "button login"
* When I type "TenLetters" in the "input user"
* Then I see the text "Ihre Benutzerkennung besteht aus 10 Zahlen."
* Then I see the attribute "disabled" in element "button login"

## Scenario: login in with incorrect password

* Given I visit the page login
* When I type "5000543327" in the "input user"
* When I type "Hallo12345" in the "input password"
* When I click the "button login"
* Then I see the text "Benutzerkennung und Passwort ist falsch"

## Scenario: login with correct credentials after incorrect password

* Given I visit the page login
* When I type "0001000699" in the "input user"
* When I type "Hallo12345" in the "input password"
* When I click the "button login"
* Then I see the text "Benutzerkennung und Passwort ist falsch"
* When I type "0001000699" in the "input user"
* When I type "Hallo12!" in the "input password"
* When I click the "button login"
* When I click the "button close modal"
* Then I not see the "button close modal"
* Then I see the page "account overview"
* Then I see the "overview credit card"

## Scenario: login with correct credentials without login sca for all test user with credit card

   |login_id  |
   |----------|
   |0001000699|
   |5100431216|
   |5100116461|
   |5003621252|

* Given I visit the page login
* When I delete login sca for user <login_id>
* When I type <login_id> in the "input user"
* When I type "Hallo12!" in the "input password"
* When I click the "button login"
* When I type smsTan "123456" and click the "button continue"
* Then I see the page "account overview"
* Then I see the url "/de"
* Then I see the "overview credit card"

## Scenario: login with correct credentials without login sca for all test user with instant access savings

   |login_id  |
   |----------|
   |0001001637|

* Given I visit the page login
* When I delete login sca for user <login_id>
* When I type <login_id> in the "input user"
* When I type "Hallo12!" in the "input password"
* When I click the "button login"
* When I type smsTan "123456" and click the "button continue"
* Then I see the page "account overview"
* Then I see the url "/de"
* Then I see the "overview investment"

## Scenario: login with correct credentials without login sca and invalid SCA

* Given I visit the page login
* When I delete login sca for user "0001000699"
* When I type "0001000699" in the "input user"
* When I type "Hallo12!" in the "input password"
* When I click the "button login"
* When I type smsTan "999999" and click the "button continue"
* Then I see the text "Ihre smsTAN ist falsch. Bitte überprüfen Sie Ihre Eingabe."
* Then I see the attribute "disabled" in element "button continue"
* Given I reset after scenario
* When I type smsTan "123456" and click the "button continue"
* Then I see the page "account overview"
* Then I see the "overview credit card"

## Scenario: login with correct credentials without login sca and cancel

* Given I visit the page login
* When I delete login sca for user "0001000699"
* When I type "0001000699" in the "input user"
* When I type "Hallo12!" in the "input password"
* When I click the "button login"
* When I click the "button cancel"
* Then I see the page "login"
* Given I reset after scenario
* When I type "0001000699" in the "input user"
* When I type "Hallo12!" in the "input password"
* When I click the "button login"
* When I type smsTan "123456" and click the "button continue"
* Then I see the page "account overview"
* Then I see the "overview credit card"

## Scenario: login with measuring the time duration to login

* Given I visit the page login
* When I type "0001000699" in the "input user"
* When I type "Hallo12!" in the "input password"
* When I click the "button login"
* When I start the clockwatch
* When I click the "button close modal"
* Then I not see the "button close modal"
* Then I see the page "account overview"
* Then I see the "overview credit card"
* When I stop the clockwatch

## Scenario: login and open new tab should be not logged in

* Given I am logged in with user "0001000699"
* When I open a browser tab
* When I visit the url "/de/"
* Then I see the url "/de/register/sign-in"
* Then I see the page "login"
* Then I see the "input user"

