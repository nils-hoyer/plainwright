<!-- Generated from the step registry by npm run docs. Do not edit. -->

# Step reference

Every built-in step, as a test writes it. Change the values in quotes to yours.
`the "Log in" button` stands for any element: its name, then one of the
[element types](writing-tests.md#elements), such as `the "Email" field`. Your own steps
and keywords are listed by `npx plainwright docs`.

## Core steps

The everyday vocabulary. Prefer these steps.

### Pages and navigation

| Step                           | What it does                                                                                                                                                      |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `I open the "Login" page`      | Opens the address of the page defined with this name and uses the element names defined for it.                                                                   |
| `I am on the "Dashboard" page` | Uses the element names defined for this page from here on, such as after a click that leads to it. Checks nothing: to check the address, add `I see the url "…"`. |
| `I open the url "/login"`      | Opens a web address, absolute or relative to the base URL. The current page stays: to use the element names of another page, add `I am on the "…" page`.          |
| `I go back`                    | Goes back to the previous page, like the browser back button.                                                                                                     |
| `I reload the page`            | Reloads the current page.                                                                                                                                         |
| `I see the url "/dashboard"`   | Checks that the address is exactly this URL (relative URLs use the base URL).                                                                                     |

### Clicking and typing

| Step                                                                  | What it does                                                                                                                       |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `I click the "Log in" button`                                         | Clicks the element once with the left mouse button.                                                                                |
| `I hover over the "Help" link`                                        | Moves the mouse over the element without clicking.                                                                                 |
| `I fill "1234567890" in the "Username" field`                         | Replaces the content of the field with the text.                                                                                   |
| `I fill the fields:`                                                  | Replaces the content of each field in the table with its text: the label of the field in the first column, the text in the second. |
| `I clear the "Full Name" field`                                       | Removes all text from the field.                                                                                                   |
| `I check the "I accept the terms and conditions" checkbox`            | Ticks the checkbox, turns on the switch or selects the radio button. Nothing changes if it already is.                             |
| `I uncheck the "Subscribe to newsletter" checkbox`                    | Unticks the checkbox or turns off the switch. Nothing changes if it already is.                                                    |
| `I select "Germany" in the "Country" dropdown`                        | Chooses the option with this visible text in the dropdown.                                                                         |
| `I press "Enter"`                                                     | Presses a key or key combination, such as "Enter", "Tab" or "Control+A", on the focused element.                                   |
| `I press "Enter" in the "Email" field`                                | Focuses the element and presses a key or key combination there.                                                                    |
| `I upload the file "data/files/invoice.pdf" with the "Upload" button` | Chooses this file (path relative to the project folder) in the file field, or in the file dialog the element opens.                |
| `I drag the "Coffee" list item to the "Cart" list`                    | Drags the first element with the mouse and drops it onto the second.                                                               |

### Checking what you see

| Step                                                                | What it does                                                                                   |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `I see the "Welcome to your Dashboard" heading`                     | Checks that the element is visible.                                                            |
| `I do not see the "Close" button`                                   | Checks that the element is hidden or not on the page.                                          |
| `I see the text "Welcome back!"`                                    | Checks that some visible element on the page contains this text, with the same capitals.       |
| `I do not see the text "Username and password are incorrect."`      | Checks that no visible element on the page contains this text, with the same capitals.         |
| `I see the text "Savings" in the "Account Overview" section`        | Checks that the element contains this text, with the same capitals.                            |
| `I do not see the text "Loans" in the "Account Overview" section`   | Checks that the element does not contain this text, with the same capitals.                    |
| `I see the value "Jane Doe" in the "Full Name" field`               | Checks that the field contains exactly this value.                                             |
| `I see "Germany" selected in the "Country" dropdown`                | Checks that the option with this visible text is selected in the dropdown.                     |
| `I see the "Full Name" field is empty`                              | Checks that the field has no value, or that the element has no text.                           |
| `I see the "Log in" button is enabled`                              | Checks that the element can be used (it is not disabled).                                      |
| `I see the "Log in" button is disabled`                             | Checks that the element is disabled and cannot be used.                                        |
| `I see the "I accept the terms and conditions" checkbox is checked` | Checks that the checkbox is ticked, the switch is on or the radio button is selected.          |
| `I see the "Subscribe to newsletter" checkbox is not checked`       | Checks that the checkbox is not ticked, the switch is off or the radio button is not selected. |
| `I see "3" items in the "Accounts" list`                            | Checks how many visible items the list has.                                                    |

### Dialogs

| Step                                                | What it does                                                                                                                                                                                      |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `I accept the next dialog`                          | Clicks OK in the next alert, confirm or prompt dialog. Use it before the step that opens the dialog; dialogs nobody announced are dismissed, except "Leave site?", which is accepted.             |
| `I dismiss the next dialog`                         | Clicks Cancel in the next confirm, prompt or "Leave site?" dialog. Use it before the step that opens the dialog; dialogs nobody announced are dismissed, except "Leave site?", which is accepted. |
| `I see a dialog with the message "Do you confirm?"` | Checks that a dialog with exactly this message was shown during the test.                                                                                                                         |

## Advanced steps

For special cases. `lint` lists where they are used.

### Pages and navigation

| Step                                      | What it does                                                    |
| ----------------------------------------- | --------------------------------------------------------------- |
| `I go forward`                            | Goes forward to the next page, like the browser forward button. |
| `I see the url containing "dashboard"`    | Checks that the address contains this text.                     |
| `I do not see the url containing "login"` | Checks that the address does not contain this text.             |
| `I see the page title "Login"`            | Checks that the title of the browser tab is exactly this text.  |
| `I see the page title containing "Log"`   | Checks that the title of the browser tab contains this text.    |

### Clicking and typing

| Step                                                                                           | What it does                                                                                                                                               |
| ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `I double click the "Order 1001" row`                                                          | Double-clicks the element.                                                                                                                                 |
| `I right click the "Order 1001" row`                                                           | Clicks the element with the right mouse button, which usually opens a context menu.                                                                        |
| `I focus on the "Full Name" field`                                                             | Puts the keyboard focus on the element without clicking it.                                                                                                |
| `I type "21102026" in the "Birthday" field`                                                    | Types the text key by key after what is already in the field, for fields that react to every key, such as a date with a mask or a search with suggestions. |
| `I select option "3" in the "Country" dropdown`                                                | Chooses the option at this position in the dropdown, counting from 1.                                                                                      |
| `I upload the files "data/files/invoice.pdf, data/files/receipt.pdf" with the "Upload" button` | Chooses several files, separated by commas, in the file field or in the file dialog the element opens.                                                     |
| `I tap the "Menu" button`                                                                      | Taps the element on a touch screen. Needs a browser with touch enabled (hasTouch).                                                                         |

### Checking what you see

| Step                                                                                | What it does                                                                                                                                        |
| ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `I see exactly the text "Hello World" in the "Greeting" element`                    | Checks that the whole text of the element is exactly this text.                                                                                     |
| `I see the items in the "Products" list in this order:`                             | Checks that the list items or table rows of the element contain the texts of the table in this order, one per row; other items may be between them. |
| `I see the "Full Name" field is focused`                                            | Checks that the element has the keyboard focus.                                                                                                     |
| `I see the "Full Name" field is editable`                                           | Checks that the field accepts input (it is neither disabled nor read-only).                                                                         |
| `I see the "Read-only Field" field is read-only`                                    | Checks that the field shows a value but does not accept input.                                                                                      |
| `I see the "Top of the page" element is in the viewport`                            | Checks that the element is inside the visible part of the page, without scrolling.                                                                  |
| `I see the "Bottom of the page" element is not in the viewport`                     | Checks that the element is outside the visible part of the page.                                                                                    |
| `I see the "Name" field with the description "This is a hint for the input below."` | Checks the description screen readers announce for the element (aria-describedby).                                                                  |
| `I see the "Required field" field with the error message "This field is required."` | Checks the error message screen readers announce for the element (aria-errormessage).                                                               |
| `I see the "Help" link leads to "/help"`                                            | Checks the address the link leads to, absolute or relative to the base URL.                                                                         |
| `I see the "Shipping" button is expanded`                                           | Checks that the element shows what it opens, such as a menu or a section of an accordion (aria-expanded, or an open details element).               |
| `I see the "Shipping" button is collapsed`                                          | Checks that the element hides what it opens, such as a closed menu or a closed section of an accordion.                                             |

### Dialogs

| Step                                        | What it does                                                                                            |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `I accept the next dialog with "My answer"` | Types the text into the next prompt dialog and clicks OK. Use it before the step that opens the dialog. |

### Tabs and frames

| Step                               | What it does                                                                              |
| ---------------------------------- | ----------------------------------------------------------------------------------------- |
| `I switch to tab "2"`              | Continues in the browser tab at this position, counting from 1.                           |
| `I open a new tab`                 | Opens an empty browser tab and continues in it.                                           |
| `I close the current tab`          | Closes the current browser tab and continues in the last remaining one.                   |
| `I see "2" tabs`                   | Checks how many browser tabs are open.                                                    |
| `I switch to the "Greeting" frame` | Continues inside the embedded frame (iframe) with this title or name, or with this alias. |
| `I switch to the main frame`       | Leaves the embedded frame and continues on the page itself.                               |

### Scrolling

| Step                                 | What it does                          |
| ------------------------------------ | ------------------------------------- |
| `I scroll to the "Contact" section`  | Scrolls until the element is in view. |
| `I scroll to the bottom of the page` | Scrolls to the end of the page.       |
| `I scroll to the top of the page`    | Scrolls to the start of the page.     |

### Waiting

| Step                                                   | What it does                                                              |
| ------------------------------------------------------ | ------------------------------------------------------------------------- |
| `I wait "2" seconds`                                   | Pauses the test for this many seconds.                                    |
| `I see the "Report ready" heading within "30" seconds` | Checks that the element becomes visible, waiting up to this many seconds. |

### Cookies and storage

| Step                                                         | What it does                                                                        |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `I set the cookie "session" to "abc123"`                     | Stores a cookie with this name and value for the current website.                   |
| `I delete the cookie "session"`                              | Removes the cookie with this name.                                                  |
| `I clear all cookies`                                        | Removes all cookies of the browser session.                                         |
| `I see the cookie "cookies_accepted"`                        | Checks that a cookie with this name exists.                                         |
| `I do not see the cookie "session"`                          | Checks that no cookie with this name exists.                                        |
| `I see the cookie "session" with the value "abc123"`         | Checks that the cookie with this name has exactly this value.                       |
| `I set the local storage item "theme" to "dark"`             | Stores a value in the local storage of the current website.                         |
| `I clear the local storage`                                  | Removes all values from the local storage of the current website.                   |
| `I see the local storage item "theme" with the value "dark"` | Checks that the local storage of the current website has this value under this key. |

### Screenshots

| Step                                                                       | What it does                                                                                                                           |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `I take a screenshot`                                                      | Adds a screenshot of the visible page to the test report.                                                                              |
| `I take a screenshot named "Login form"`                                   | Adds a screenshot of the visible page to the test report under this name.                                                              |
| `I take a screenshot of the "Account Overview" section`                    | Adds a screenshot of just this element to the test report.                                                                             |
| `I see the "Blue square" section matches the screenshot "blue-square.png"` | Compares the element with the stored screenshot of this name. Without one, it stores one next to the feature file and fails once.      |
| `I see the page matches the screenshot "swatch-page.png"`                  | Compares the visible page with the stored screenshot of this name. Without one, it stores one next to the feature file and fails once. |

### Downloads

| Step                                            | What it does                                                                                              |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `I see the downloaded file "orders.csv"`        | Checks the file name of the last download, and waits for it after a click on a link or button.            |
| `I see the text "Total" in the downloaded file` | Checks that the last download contains this text, with the same capitals, and waits for it after a click. |

### Test data and APIs

| Step                                                                       | What it does                                                                                                                       |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `I remember "Coffee" as "item"`                                            | Keeps the value under the name for the rest of the test; later steps write it as "{name}".                                         |
| `I remember the text of the "Order number" field as "order-number"`        | Keeps the text of the element, or the value of a field, under the name for the rest of the test.                                   |
| `I remember the url as "order-page"`                                       | Keeps the address the browser shows, without the base URL when it is on the same website.                                          |
| `I remember the number in "{confirmation}" as "order"`                     | Keeps the number in the text, such as 10234 in "Order #10234 was created.", as written; in an address the last number of its path. |
| `I create "order" at "/api/orders" with "{new-order}"`                     | Sends the value as JSON in a POST request to the address, checks that it succeeded and remembers the answer under the name.        |
| `I delete "/api/orders/{order.id}" after the test`                         | Sends a DELETE request to the address after the test, also when it failed. An address that is already gone counts as deleted.      |
| `I send a "GET" request to "/api/orders"`                                  | Sends a request (GET, POST, PUT, PATCH or DELETE) to the address and remembers the answer as "{response}".                         |
| `I send a "PATCH" request to "/api/orders/{order.id}" with "{paid-order}"` | Sends a request with the value as JSON to the address and remembers the answer as "{response}".                                    |
| `I see the response status "201"`                                          | Checks the status code of the answer to the last request, e.g. "200" or "404".                                                     |
| `I see the response field "status" with the value "paid"`                  | Checks a field in the answer to the last request; "items.0.name" is the name of the first item.                                    |

## Steps Plainwright leaves out

Steps that other tools have and Plainwright leaves out on purpose, with what to write instead. `lint` says the same where one is used.

| Step                                                            | Instead                                                                                                                                                                                                                                                                          |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `I wait "…" millisecond(s)`                                     | Check for what the user waits for instead, such as `I see the text "…"`: every check waits by itself. Where a fixed wait cannot be avoided: `I wait "0.5" seconds`.                                                                                                              |
| `I wait for the page to load`                                   | Opening a page and clicking already wait for it. Check for what the user waits for instead, such as `I see the "…" heading`.                                                                                                                                                     |
| `I wait for network idle`                                       | Opening a page and clicking already wait for it. Check for what the user waits for instead, such as `I see the "…" heading`.                                                                                                                                                     |
| `I type "…" on the keyboard`                                    | Name the field: `I type "…" in the "…" field`, which also presses the keys one by one. To replace its content, `I fill "…" in the "…" field`.                                                                                                                                    |
| `I hold down the key "…"`                                       | Press a key or a combination with `I press "Shift+A"`, or `I press "…" in the "…" field`. To hold a key while doing something else, write a step in TypeScript (docs/writing-steps.md).                                                                                          |
| `I release the key "…"`                                         | Press a key or a combination with `I press "Shift+A"`, or `I press "…" in the "…" field`. To hold a key while doing something else, write a step in TypeScript (docs/writing-steps.md).                                                                                          |
| `I insert the text "…"`                                         | Name the field: `I fill "…" in the "…" field`.                                                                                                                                                                                                                                   |
| `I click at x "…" y "…"`                                        | Name the element instead: `I click the "…" button`. A position breaks when the layout changes, and a reviewer cannot tell what is there. For a canvas, a map or a signature pad, write a step in TypeScript (docs/writing-steps.md).                                             |
| `I double click at x "…" y "…"`                                 | Name the element instead: `I click the "…" button`. A position breaks when the layout changes, and a reviewer cannot tell what is there. For a canvas, a map or a signature pad, write a step in TypeScript (docs/writing-steps.md).                                             |
| `I right click at x "…" y "…"`                                  | Name the element instead: `I click the "…" button`. A position breaks when the layout changes, and a reviewer cannot tell what is there. For a canvas, a map or a signature pad, write a step in TypeScript (docs/writing-steps.md).                                             |
| `I move the mouse to x "…" y "…"`                               | Name the element instead: `I hover over the "…" link`. A position breaks when the layout changes, and a reviewer cannot tell what is there. For a canvas, a map or a signature pad, write a step in TypeScript (docs/writing-steps.md).                                          |
| `I press the mouse button`                                      | Drag with `I drag the "…" list item to the "…" list`. For drawing, write a step in TypeScript (docs/writing-steps.md).                                                                                                                                                           |
| `I press the "…" mouse button`                                  | Drag with `I drag the "…" list item to the "…" list`. For drawing, write a step in TypeScript (docs/writing-steps.md).                                                                                                                                                           |
| `I release the mouse button`                                    | Drag with `I drag the "…" list item to the "…" list`. For drawing, write a step in TypeScript (docs/writing-steps.md).                                                                                                                                                           |
| `I scroll the mouse wheel by x "…" y "…"`                       | Scroll to what you need instead: `I scroll to the "…" section`, or to the bottom of the page. Clicks and checks scroll by themselves.                                                                                                                                            |
| `I tap at x "…" y "…"`                                          | Name the element instead: `I tap the "…" button`. A position breaks when the layout changes, and a reviewer cannot tell what is there. For a canvas, a map or a signature pad, write a step in TypeScript (docs/writing-steps.md).                                               |
| `I scroll down by "…" pixels`                                   | Scroll to what you need instead: `I scroll to the "…" section`, or to the bottom of the page. Clicks and checks scroll by themselves.                                                                                                                                            |
| `I scroll up by "…" pixels`                                     | Scroll to what you need instead: `I scroll to the "…" section`, or to the bottom of the page. Clicks and checks scroll by themselves.                                                                                                                                            |
| `I see the attribute "…" on the "…" element`                    | Check what the user sees instead: `I see the "…" button is disabled`, is enabled, is checked or is expanded. For a check no step has, write a step in TypeScript (docs/writing-steps.md).                                                                                        |
| `I do not see the attribute "…" on the "…" element`             | Check what the user sees instead: `I see the "…" button is disabled`, is enabled, is checked or is expanded. For a check no step has, write a step in TypeScript (docs/writing-steps.md).                                                                                        |
| `I see the attribute "…" with the value "…" on the "…" element` | For a link: `I see the "…" link leads to "/…"`. For a menu or an accordion: `I see the "…" button is expanded`. For a check no step has, write a step in TypeScript (docs/writing-steps.md).                                                                                     |
| `I see the attribute "…" containing "…" on the "…" element`     | For a link: `I see the "…" link leads to "/…"`. For a menu or an accordion: `I see the "…" button is expanded`. For a check no step has, write a step in TypeScript (docs/writing-steps.md).                                                                                     |
| `I see the class "…" on the "…" element`                        | A class is how the page is built, not what the user sees. Check the state instead, such as `I see the "…" button is disabled`, or how it looks: `I see the "…" element matches the screenshot "…"`.                                                                              |
| `I do not see the class "…" on the "…" element`                 | A class is how the page is built, not what the user sees. Check the state instead, such as `I see the "…" button is disabled`, or how it looks: `I see the "…" element matches the screenshot "…"`.                                                                              |
| `I download the file with the "…" element`                      | Click it: `I click the "…" button`. Every click catches a download, and `I see the downloaded file "…"` waits for it.                                                                                                                                                            |
| `I save the downloaded file to "…"`                             | Check the file with `I see the text "…" in the downloaded file`. A file to upload goes into the project, such as data/files/, for `I upload the file "data/files/…" with the "…" button`.                                                                                        |
| `I run the command "…"`                                         | A reviewer cannot judge a shell command, and it depends on the shell. Fill the database once per run with globalSetup or the webServer command in playwright.config.ts (docs/setup.md), and create the data one test needs through the app: `I create "…" at "/api/…" with "…"`. |
