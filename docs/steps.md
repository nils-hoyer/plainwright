<!-- Generated from the step registry by npm run docs. Do not edit. -->

# Step reference

Every built-in step, with what it does and an example. Your own steps and keywords are
listed by `npx plainwright docs --steps "steps/**/*.ts"`. How to write elements
is in [writing tests](writing-tests.md#how-a-step-is-built).

## Core steps

The everyday vocabulary. Prefer these steps.

### Pages and navigation

| Step                        | What it does                                                                                      | Example                        |
| --------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------ |
| `I open the {string} page`  | Opens the address of the page defined with this name and uses the element names defined for it.   | `I open the "Login" page`      |
| `I am on the {string} page` | Checks that the browser shows the address of this page and uses the element names defined for it. | `I am on the "Dashboard" page` |
| `I open the url {string}`   | Opens a web address, absolute or relative to the base URL.                                        | `I open the url "/login"`      |
| `I go back`                 | Goes back to the previous page, like the browser back button.                                     | `I go back`                    |
| `I reload the page`         | Reloads the current page.                                                                         | `I reload the page`            |
| `I see the url {string}`    | Checks that the address is exactly this URL (relative URLs use the base URL).                     | `I see the url "/dashboard"`   |

### Clicking and typing

| Step                                            | What it does                                                                                                        | Example                                                          |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `I click the {element}`                         | Clicks the element once with the left mouse button.                                                                 | `I click the "Log in" button`                                    |
| `I double click the {element}`                  | Double-clicks the element.                                                                                          | `I double click the "Order 1001" row`                            |
| `I hover over the {element}`                    | Moves the mouse over the element without clicking.                                                                  | `I hover over the "Help" link`                                   |
| `I fill {string} in the {element}`              | Replaces the content of the field with the text.                                                                    | `I fill "1234567890" in the "Username" field`                    |
| `I clear the {element}`                         | Removes all text from the field.                                                                                    | `I clear the "Full Name" field`                                  |
| `I check the {element}`                         | Ticks the checkbox or selects the radio button. Nothing changes if it is already ticked.                            | `I check the "I accept the terms and conditions" checkbox`       |
| `I uncheck the {element}`                       | Unticks the checkbox. Nothing changes if it is already unticked.                                                    | `I uncheck the "Subscribe to newsletter" checkbox`               |
| `I select {string} in the {element}`            | Chooses the option with this visible text in the dropdown.                                                          | `I select "Germany" in the "Country" dropdown`                   |
| `I press {string}`                              | Presses a key or key combination, such as "Enter", "Tab" or "Control+A", on the focused element.                    | `I press "Enter"`                                                |
| `I press {string} in the {element}`             | Focuses the element and presses a key or key combination there.                                                     | `I press "Enter" in the "Email" field`                           |
| `I upload the file {string} with the {element}` | Chooses this file (path relative to the project folder) in the file field, or in the file dialog the element opens. | `I upload the file "files/invoice.pdf" with the "Upload" button` |
| `I drag the {element} to the {element}`         | Drags the first element with the mouse and drops it onto the second.                                                | `I drag the "Coffee" list item to the "Cart" list`               |

### Checking what you see

| Step                                              | What it does                                                                             | Example                                                             |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `I see the {element}`                             | Checks that the element is visible.                                                      | `I see the "Welcome to your Dashboard" heading`                     |
| `I do not see the {element}`                      | Checks that the element is hidden or not on the page.                                    | `I do not see the "Close" button`                                   |
| `I see the text {string}`                         | Checks that some visible element on the page contains this text, with the same capitals. | `I see the text "Welcome back!"`                                    |
| `I do not see the text {string}`                  | Checks that no visible element on the page contains this text, with the same capitals.   | `I do not see the text "Username and password are incorrect."`      |
| `I see the text {string} in the {element}`        | Checks that the element contains this text, with the same capitals.                      | `I see the text "Savings" in the "Account Overview" section`        |
| `I do not see the text {string} in the {element}` | Checks that the element does not contain this text, with the same capitals.              | `I do not see the text "Loans" in the "Account Overview" section`   |
| `I see the value {string} in the {element}`       | Checks that the field contains exactly this value.                                       | `I see the value "Jane Doe" in the "Full Name" field`               |
| `I see {string} selected in the {element}`        | Checks that the option with this visible text is selected in the dropdown.               | `I see "Germany" selected in the "Country" dropdown`                |
| `I see the {element} is empty`                    | Checks that the field has no value, or that the element has no text.                     | `I see the "Full Name" field is empty`                              |
| `I see the {element} is enabled`                  | Checks that the element can be used (it is not disabled).                                | `I see the "Log in" button is enabled`                              |
| `I see the {element} is disabled`                 | Checks that the element is disabled and cannot be used.                                  | `I see the "Log in" button is disabled`                             |
| `I see the {element} is checked`                  | Checks that the checkbox is ticked or the radio button is selected.                      | `I see the "I accept the terms and conditions" checkbox is checked` |
| `I see the {element} is not checked`              | Checks that the checkbox is not ticked or the radio button is not selected.              | `I see the "Subscribe to newsletter" checkbox is not checked`       |
| `I see {number} item(s) in the {element}`         | Checks how many visible items the list has.                                              | `I see "3" items in the "Accounts" list`                            |

### Dialogs

| Step                                       | What it does                                                                                                                                                                                      | Example                                             |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `I accept the next dialog`                 | Clicks OK in the next alert, confirm or prompt dialog. Use it before the step that opens the dialog; dialogs nobody announced are dismissed, except "Leave site?", which is accepted.             | `I accept the next dialog`                          |
| `I dismiss the next dialog`                | Clicks Cancel in the next confirm, prompt or "Leave site?" dialog. Use it before the step that opens the dialog; dialogs nobody announced are dismissed, except "Leave site?", which is accepted. | `I dismiss the next dialog`                         |
| `I see a dialog with the message {string}` | Checks that a dialog with exactly this message was shown during the test.                                                                                                                         | `I see a dialog with the message "Do you confirm?"` |

## Advanced steps

For special cases. `lint` lists where they are used.

### Pages and navigation

| Step                                       | What it does                                                                             | Example                                   |
| ------------------------------------------ | ---------------------------------------------------------------------------------------- | ----------------------------------------- |
| `I use the page object {string}`           | Uses the element names defined for this page without opening it or checking the address. | `I use the page object "Login"`           |
| `I go forward`                             | Goes forward to the next page, like the browser forward button.                          | `I go forward`                            |
| `I see the url containing {string}`        | Checks that the address contains this text.                                              | `I see the url containing "dashboard"`    |
| `I do not see the url containing {string}` | Checks that the address does not contain this text.                                      | `I do not see the url containing "login"` |
| `I see the page title {string}`            | Checks that the title of the browser tab is exactly this text.                           | `I see the page title "Login"`            |
| `I see the page title containing {string}` | Checks that the title of the browser tab contains this text.                             | `I see the page title containing "Log"`   |

### Clicking and typing

| Step                                             | What it does                                                                                           | Example                                                                              |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| `I right click the {element}`                    | Clicks the element with the right mouse button, which usually opens a context menu.                    | `I right click the "Order 1001" row`                                                 |
| `I focus on the {element}`                       | Puts the keyboard focus on the element without clicking it.                                            | `I focus on the "Full Name" field`                                                   |
| `I select option {number} in the {element}`      | Chooses the option at this position in the dropdown, counting from 1.                                  | `I select option "3" in the "Country" dropdown`                                      |
| `I upload the files {string} with the {element}` | Chooses several files, separated by commas, in the file field or in the file dialog the element opens. | `I upload the files "files/invoice.pdf, files/receipt.pdf" with the "Upload" button` |

### Checking what you see

| Step                                                                    | What it does                                                                          | Example                                                                             |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `I see exactly the text {string} in the {element}`                      | Checks that the whole text of the element is exactly this text.                       | `I see exactly the text "Hello World" in the "Greeting" element`                    |
| `I see the {element} is focused`                                        | Checks that the element has the keyboard focus.                                       | `I see the "Full Name" field is focused`                                            |
| `I see the {element} is editable`                                       | Checks that the field accepts input (it is neither disabled nor read-only).           | `I see the "Full Name" field is editable`                                           |
| `I see the {element} is read-only`                                      | Checks that the field shows a value but does not accept input.                        | `I see the "Read-only Field" field is read-only`                                    |
| `I see the {element} is in the viewport`                                | Checks that the element is inside the visible part of the page, without scrolling.    | `I see the "Top of the page" element is in the viewport`                            |
| `I see the {element} is not in the viewport`                            | Checks that the element is outside the visible part of the page.                      | `I see the "Bottom of the page" element is not in the viewport`                     |
| `I see the {element} with the description {string}`                     | Checks the description screen readers announce for the element (aria-describedby).    | `I see the "Name" field with the description "This is a hint for the input below."` |
| `I see the {element} with the error message {string}`                   | Checks the error message screen readers announce for the element (aria-errormessage). | `I see the "Required field" field with the error message "This field is required."` |
| `I see the attribute {string} on the {element}`                         | Checks that the element has this HTML attribute, with any value.                      | `I see the attribute "disabled" on the "Coming Soon" button`                        |
| `I do not see the attribute {string} on the {element}`                  | Checks that the element does not have this HTML attribute.                            | `I do not see the attribute "disabled" on the "Transfer Money" button`              |
| `I see the attribute {string} with the value {string} on the {element}` | Checks that the HTML attribute of the element has exactly this value.                 | `I see the attribute "href" with the value "/help" on the "Help" link`              |
| `I see the attribute {string} containing {string} on the {element}`     | Checks that the HTML attribute of the element contains this text.                     | `I see the attribute "href" containing "help" on the "Help" link`                   |
| `I see the class {string} on the {element}`                             | Checks that the element has this CSS class (among others).                            | `I see the class "highlighted" on the "Styled box" element`                         |
| `I do not see the class {string} on the {element}`                      | Checks that the element does not have this CSS class.                                 | `I do not see the class "hidden" on the "Styled box" element`                       |

### Dialogs

| Step                                     | What it does                                                                                            | Example                                     |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `I accept the next dialog with {string}` | Types the text into the next prompt dialog and clicks OK. Use it before the step that opens the dialog. | `I accept the next dialog with "My answer"` |

### Tabs and frames

| Step                             | What it does                                                                              | Example                            |
| -------------------------------- | ----------------------------------------------------------------------------------------- | ---------------------------------- |
| `I switch to tab {number}`       | Continues in the browser tab at this position, counting from 1.                           | `I switch to tab "2"`              |
| `I open a new tab`               | Opens an empty browser tab and continues in it.                                           | `I open a new tab`                 |
| `I close the current tab`        | Closes the current browser tab and continues in the last remaining one.                   | `I close the current tab`          |
| `I see {number} tab(s)`          | Checks how many browser tabs are open.                                                    | `I see "2" tabs`                   |
| `I switch to the {string} frame` | Continues inside the embedded frame (iframe) with this title or name, or with this alias. | `I switch to the "Greeting" frame` |
| `I switch to the main frame`     | Leaves the embedded frame and continues on the page itself.                               | `I switch to the main frame`       |

### Keyboard, mouse and touch

| Step                                                | What it does                                                                                                         | Example                                     |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `I type {string} on the keyboard`                   | Types the text key by key into the focused element, without clearing it first. To replace a field value, use I fill. | `I type "Hello" on the keyboard`            |
| `I hold down the key {string}`                      | Presses the key and keeps it pressed until I release the key.                                                        | `I hold down the key "Shift"`               |
| `I release the key {string}`                        | Releases a key that was held down.                                                                                   | `I release the key "Shift"`                 |
| `I insert the text {string}`                        | Inserts the text into the focused element at once, without key presses (like pasting).                               | `I insert the text "嗨"`                    |
| `I click at x {number} y {number}`                  | Clicks at this position, in pixels from the top left corner of the page view.                                        | `I click at x "200" y "150"`                |
| `I double click at x {number} y {number}`           | Double-clicks at this position, in pixels from the top left corner of the page view.                                 | `I double click at x "200" y "150"`         |
| `I right click at x {number} y {number}`            | Right-clicks at this position, in pixels from the top left corner of the page view.                                  | `I right click at x "200" y "150"`          |
| `I move the mouse to x {number} y {number}`         | Moves the mouse to this position, in pixels from the top left corner of the page view.                               | `I move the mouse to x "200" y "150"`       |
| `I press the mouse button`                          | Presses the left mouse button and keeps it pressed until I release the mouse button.                                 | `I press the mouse button`                  |
| `I press the {string} mouse button`                 | Presses the "left", "right" or "middle" mouse button and keeps it pressed.                                           | `I press the "left" mouse button`           |
| `I release the mouse button`                        | Releases the mouse button that was pressed.                                                                          | `I release the mouse button`                |
| `I scroll the mouse wheel by x {number} y {number}` | Turns the mouse wheel by this many pixels sideways (x) and down (y).                                                 | `I scroll the mouse wheel by x "0" y "100"` |
| `I tap the {element}`                               | Taps the element on a touch screen. Needs a browser with touch enabled (hasTouch).                                   | `I tap the "Menu" button`                   |
| `I tap at x {number} y {number}`                    | Taps at this position on a touch screen. Needs a browser with touch enabled (hasTouch).                              | `I tap at x "300" y "200"`                  |

### Scrolling

| Step                                 | What it does                               | Example                              |
| ------------------------------------ | ------------------------------------------ | ------------------------------------ |
| `I scroll to the {element}`          | Scrolls until the element is in view.      | `I scroll to the "Contact" section`  |
| `I scroll to the bottom of the page` | Scrolls to the end of the page.            | `I scroll to the bottom of the page` |
| `I scroll to the top of the page`    | Scrolls to the start of the page.          | `I scroll to the top of the page`    |
| `I scroll down by {number} pixels`   | Scrolls the page down by this many pixels. | `I scroll down by "500" pixels`      |
| `I scroll up by {number} pixels`     | Scrolls the page up by this many pixels.   | `I scroll up by "200" pixels`        |

### Waiting

| Step                                            | What it does                                                              | Example                                                |
| ----------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------ |
| `I see the {element} within {number} second(s)` | Checks that the element becomes visible, waiting up to this many seconds. | `I see the "Report ready" heading within "30" seconds` |

### Cookies and storage

| Step                                                            | What it does                                                                                                                             | Example                                                      |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `I set the cookie {string} to {string}`                         | Stores a cookie with this name and value for the current website.                                                                        | `I set the cookie "session" to "abc123"`                     |
| `I delete the cookie {string}`                                  | Removes the cookie with this name.                                                                                                       | `I delete the cookie "session"`                              |
| `I clear all cookies`                                           | Removes all cookies of the browser session.                                                                                              | `I clear all cookies`                                        |
| `I see the cookie {string}`                                     | Checks that a cookie with this name exists.                                                                                              | `I see the cookie "cookies_accepted"`                        |
| `I do not see the cookie {string}`                              | Checks that no cookie with this name exists.                                                                                             | `I do not see the cookie "session"`                          |
| `I see the cookie {string} with the value {string}`             | Checks that the cookie with this name has exactly this value.                                                                            | `I see the cookie "session" with the value "abc123"`         |
| `I set the local storage item {string} to {string}`             | Stores a value in the local storage of the current website.                                                                              | `I set the local storage item "theme" to "dark"`             |
| `I clear the local storage`                                     | Removes all values from the local storage of the current website.                                                                        | `I clear the local storage`                                  |
| `I see the local storage item {string} with the value {string}` | Checks that the local storage of the current website has this value under this key.                                                      | `I see the local storage item "theme" with the value "dark"` |
| `I keep the session`                                            | Saves the cookies and storage of the browser, so every scenario after the @setup ones starts with them, except those tagged @logged-out. | `I keep the session`                                         |
| `I keep the session for {string} scenarios`                     | Saves the cookies and storage of the browser for the scenarios with this tag, which start with them instead of the session kept for all. | `I keep the session for "@admin" scenarios`                  |

### Screenshots

| Step                                                  | What it does                                                                                                                           | Example                                                                    |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `I take a screenshot`                                 | Adds a screenshot of the visible page to the test report.                                                                              | `I take a screenshot`                                                      |
| `I take a screenshot named {string}`                  | Adds a screenshot of the visible page to the test report under this name.                                                              | `I take a screenshot named "Login form"`                                   |
| `I take a screenshot of the {element}`                | Adds a screenshot of just this element to the test report.                                                                             | `I take a screenshot of the "Account Overview" section`                    |
| `I see the {element} matches the screenshot {string}` | Compares the element with the stored screenshot of this name. Without one, it stores one next to the feature file and fails once.      | `I see the "Blue square" section matches the screenshot "blue-square.png"` |
| `I see the page matches the screenshot {string}`      | Compares the visible page with the stored screenshot of this name. Without one, it stores one next to the feature file and fails once. | `I see the page matches the screenshot "swatch-page.png"`                  |

### Downloads

| Step                                             | What it does                                                              | Example                                                   |
| ------------------------------------------------ | ------------------------------------------------------------------------- | --------------------------------------------------------- |
| `I download the file with the {element}`         | Clicks the element and waits until the file it offers has downloaded.     | `I download the file with the "Export" button`            |
| `I see the downloaded file {string}`             | Checks the file name of the last download.                                | `I see the downloaded file "orders.csv"`                  |
| `I see the text {string} in the downloaded file` | Checks that the last download contains this text, with the same capitals. | `I see the text "Total" in the downloaded file`           |
| `I save the downloaded file to {string}`         | Saves the last download at this path, relative to the project folder.     | `I save the downloaded file to "test-results/report.csv"` |

### Test data and APIs

| Step                                                        | What it does                                                                                                                                | Example                                                                    |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `I remember {string} as {string}`                           | Keeps the value under the name for the rest of the test; later steps write it as "{name}".                                                  | `I remember "Coffee" as "item"`                                            |
| `I remember the text of the {element} as {string}`          | Keeps the text of the element, or the value of a field, under the name for the rest of the test.                                            | `I remember the text of the "Order number" field as "order-number"`        |
| `I remember the first number in the {element} as {string}`  | Waits until the text of the element, or the value of a field, has a number, and keeps the first one as written.                             | `I remember the first number in the "Confirmation" message as "order"`     |
| `I remember the url as {string}`                            | Keeps the address the browser shows, without the base URL when it is on the same website.                                                   | `I remember the url as "order-page"`                                       |
| `I remember the last number in the url as {string}`         | Waits until the path of the address has a number, and keeps the last one; the query and the part after # count only when the path has none. | `I remember the last number in the url as "order"`                         |
| `I create {string} at {string} with {string}`               | Sends the value as JSON in a POST request to the address, checks that it succeeded and remembers the answer under the name.                 | `I create "order" at "/api/orders" with "{new-order}"`                     |
| `I delete {string} after the test`                          | Sends a DELETE request to the address after the test, also when it failed. An address that is already gone counts as deleted.               | `I delete "/api/orders/{order.id}" after the test`                         |
| `I send a {string} request to {string}`                     | Sends a request (GET, POST, PUT, PATCH or DELETE) to the address and remembers the answer as "{response}".                                  | `I send a "GET" request to "/api/orders"`                                  |
| `I send a {string} request to {string} with {string}`       | Sends a request with the value as JSON to the address and remembers the answer as "{response}".                                             | `I send a "PATCH" request to "/api/orders/{order.id}" with "{paid-order}"` |
| `I see the response status {number}`                        | Checks the status code of the answer to the last request, e.g. "200" or "404".                                                              | `I see the response status "201"`                                          |
| `I see the response field {string} with the value {string}` | Checks a field in the answer to the last request; "items.0.name" is the name of the first item.                                             | `I see the response field "status" with the value "paid"`                  |
| `I run the command {string}`                                | Runs the command in the project folder, e.g. a script that fills the database, and fails when the command fails.                            | `I run the command "npm run db:seed"`                                      |

## Removed steps

Steps a release removed, with what to write instead. `lint` says the same where one is still used.

| Step                             | Removed in | Instead                                                                                                                                                         |
| -------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `I wait {number} second(s)`      | 0.3.0      | Check for what the user waits for instead, such as I see the text "…": every check waits by itself. For a slow page: I see the "…" heading within "30" seconds. |
| `I wait {number} millisecond(s)` | 0.3.0      | Check for what the user waits for instead, such as I see the text "…": every check waits by itself. For a slow page: I see the "…" heading within "30" seconds. |
| `I wait for the page to load`    | 0.3.0      | Opening a page and clicking already wait for it. Check for what the user waits for instead, such as I see the "…" heading.                                      |
| `I wait for network idle`        | 0.3.0      | Opening a page and clicking already wait for it. Check for what the user waits for instead, such as I see the "…" heading.                                      |
