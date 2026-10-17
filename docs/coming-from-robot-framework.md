# Coming from Robot Framework

Robot Framework and Plainwright share the idea of keyword-driven tests: tests are made
of named actions, and teams build their own keywords from smaller ones. The differences are in
syntax and in how elements are named.

## Concepts

| Robot Framework                           | Plainwright                                                      |
| ----------------------------------------- | ---------------------------------------------------------------- |
| Test suite (`.robot` file)                | Feature file (`.feature`)                                        |
| Test case                                 | `Scenario:`                                                      |
| `Suite Setup` / `Test Setup`              | `Background:` (steps before every scenario)                      |
| `Test Teardown`                           | `I delete "…" after the test` in a keyword; else fixtures        |
| Library keyword (`Click Button`)          | Built-in step (`I click the "…" button`)                         |
| User keyword (`*** Keywords ***`)         | Keyword: `Scenario Outline:` in `keywords/*.feature`             |
| Keyword argument `${username}`            | Keyword parameter `"<username>"`                                 |
| Python keyword library                    | TypeScript step with `defineStep()`                              |
| Locator `id=username`, `css=…`, `xpath=…` | Visible name: `the "Username" field`; alias for unnamed elements |
| Test template / data-driven tests         | `Scenario Outline:` with `Examples:`                             |
| Tags, `--include smoke`                   | Tags, `npm test -- --grep @smoke`                                |
| `log.html` / `report.html`                | Playwright HTML report with traces                               |
| Variables `${VAR}`, variable files        | `data/*.json` and `.env`, written `"{users.admin.email}"`        |
| `Set Test Variable`                       | `I remember "…" as "…"`, written `"{name}"` later in the test    |
| `IF` / `FOR`                              | Not supported on purpose: tests stay linear and readable         |

## Library keywords

| Robot Framework (Browser / SeleniumLibrary)          | Plainwright                                    |
| ---------------------------------------------------- | ---------------------------------------------- |
| `Go To    ${URL}/login`                              | `I open the "Login" page`                      |
| `Input Text    id=username    jane`                  | `I fill "jane" in the "Username" field`        |
| `Click Button    Log in`                             | `I click the "Log in" button`                  |
| `Click Link    Forgot password?`                     | `I click the "Forgot password?" link`          |
| `Select From List By Label    id=country    Germany` | `I select "Germany" in the "Country" dropdown` |
| `Select Checkbox    id=terms`                        | `I check the "I accept the terms" checkbox`    |
| `Page Should Contain    Welcome back!`               | `I see the text "Welcome back!"`               |
| `Element Should Be Visible    id=modal`              | `I see the "Welcome back!" dialog`             |
| `Element Should Be Disabled    id=submit`            | `I see the "Log in" button is disabled`        |
| `Textfield Value Should Be    id=name    Jane`       | `I see the value "Jane" in the "Name" field`   |
| `Location Should Contain    /dashboard`              | `I see the url containing "/dashboard"`        |
| `Sleep    2s`                                        | Avoid. Every `I see` step waits automatically. |

Robot's wording is short; Plainwright reads as a sentence and every value is quoted.

## User keywords

```robotframework
*** Keywords ***
Log In As
    [Arguments]    ${username}    ${password}
    Go To    ${URL}/login
    Input Text    id=username    ${username}
    Input Text    id=password    ${password}
    Click Button    Log in
```

```gherkin
# keywords/account.feature
Feature: Account

  Scenario Outline: I log in as "<username>" with password "<password>"
    * I open the "Login" page
    * I fill "<username>" in the "Username" field
    * I fill "<password>" in the "Password" field
    * I click the "Log in" button
```

Keywords can call other keywords. They are checked before tests run: every step must exist,
every parameter must be used, and keywords must not call each other in a loop. In the report,
a keyword shows its steps nested, like Robot's keyword tree in `log.html`.

## Getting started

See [getting started](../README.md#getting-started), then read the
[vocabulary rules](vocabulary.md). `npx plainwright catalog` lists every step if you are
looking for the equivalent of a library keyword.
