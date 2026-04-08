# Playwright API Coverage Analysis

Stand: 8. April 2026

## Vorhandene Step-Kategorien (✅ implementiert)

| Datei | Abdeckung |
|---|---|
| `navigation.steps.ts` | `page.goto`, `goBack`, `goForward`, `reload`, `waitForURL`, URL-Assertions |
| `click.steps.ts` | click, dblclick, rightclick, hover, focus, getByText, getByRole (button/link) |
| `form.steps.ts` | fill, clear, check, uncheck, selectOption, setInputFiles, keyboard.press |
| `visibility.steps.ts` | `toBeVisible`, `toBeHidden`, `getByText` sichtbar, count |
| `attributes.steps.ts` | `toHaveAttribute`, `toHaveValue`, `toBeDisabled`, `toBeEnabled`, `toBeChecked`, `toBeFocused`, `toBeEditable` |
| `wait.steps.ts` | `waitFor` (visible/hidden/enabled), Timeout-Steps |
| `scroll.steps.ts` | scroll to bottom/top/element, scroll by pixels |
| `tabs.steps.ts` | new tab, switch tab, close tab, tab count |
| `dialogs.steps.ts` | accept, dismiss, accept with text, dialog message prüfen |
| `screenshot.steps.ts` | full page, named, element screenshot |
| `keyboard.steps.ts` | type text, press key |
| `frames.steps.ts` | switch to frame, switch to main frame |
| `storage.steps.ts` | cookies (set/delete/clear/check), localStorage (set/clear/check) |

---

## Lücken-Ranking nach Priorität

### Tier 1 – Kritisch fehlend

| # | API | Fehlt | Vorgeschlagener Step |
|---|---|---|---|
| 1 | `PageAssertions.toHaveTitle()` | Seitentitel prüfen | `Then the page title equals {string}` / `contains {string}` |
| 2 | `LocatorAssertions.toHaveText()` | Textinhalt eines Elements | `Then the text of {string} equals {string}` / `contains {string}` |
| 3 | `LocatorAssertions.toContainText()` | Teiltext in Element | (siehe oben) |
| 4 | `Page.dragAndDrop()` / `Locator.dragTo()` | Drag & Drop | `When I drag {string} to {string}` |
| 5 | `LocatorAssertions.toHaveClass()` | CSS-Klasse prüfen | `Then the {string} has class {string}` |

### Tier 2 – Wichtig

| # | API | Fehlt | Vorgeschlagener Step |
|---|---|---|---|
| 6 | `LocatorAssertions.toHaveCSS()` | CSS-Property prüfen | `Then the CSS property {string} of {string} equals {string}` |
| 7 | `LocatorAssertions.toBeInViewport()` | Element im Viewport | `Then the {string} is in viewport` |
| 8 | `Page.route()` / `Route` | HTTP Request Mocking | `When I mock the route {string} with status {int}` |
| 9 | `Page.waitForResponse()` | Auf HTTP-Response warten | `When I wait for the response {string}` |
| 10 | `BrowserContext` sessionStorage | Session Storage | `When I set session storage {string} to {string}` |
| 11 | `Download` | File-Downloads | `When I download the file from {string}` |

### Tier 3 – Situativ nützlich

| # | API | Fehlt | Vorgeschlagener Step |
|---|---|---|---|
| 12 | `Clock` | Zeitsteuerung | `When I set the clock to {string}` |
| 13 | `LocatorAssertions.toBeAttached()` | Im DOM vorhanden | `Then the {string} is attached to the DOM` |
| 14 | `BrowserContext.grantPermissions()` | Browser-Permissions | `When I grant the permission {string}` |
| 15 | `BrowserContext.setGeolocation()` | Geolocation mocken | `When I set geolocation to {string} {string}` |
| 16 | `Page.setViewportSize()` | Viewport-Größe | `When I set the viewport to {int} by {int} pixels` |
| 17 | `Locator.selectText()` | Text selektieren | `When I select the text in {string}` |
| 18 | `Touchscreen` | Touch-Events | `When I tap {string}` |

### Tier 4 – Nicht BDD-geeignet (kein Step nötig)

| API | Begründung |
|---|---|
| `Page.evaluate()` / `JSHandle` | Zu technisch; in Page Objects kapseln |
| `Tracing` | DevOps-Tooling |
| `Coverage` | Tooling |
| `CDPSession` | Low-level Chrome-DevTools |
| `BrowserServer` / `BrowserType` | Infrastruktur |
| `WebSocket` / `WebSocketRoute` | Zu spezifisch, Custom Steps pro Projekt |
| `Worker` | Service/Web Worker – sehr niche |
| `Screencast` | Kein funktionaler Step |
| `Debugger` | Dev-Tool |

---

## Nächste Schritte

1. ✅ **Tier 1 komplett:** `assertions.steps.ts` – alle `LocatorAssertions` + `PageAssertions`
2. ⬜ `drag.steps.ts` – Drag & Drop  
3. ⬜ `network.steps.ts` – Route-Mocking, waitForResponse
4. ⬜ `storage.steps.ts` erweitern – Session Storage
5. ⬜ `download.steps.ts` – Download-Handling
6. ⬜ `clock.steps.ts` – Zeit-Manipulation
7. ⬜ `context.steps.ts` – Permissions, Geolocation, Viewport

---

## assertions.steps.ts – implementierte Steps

### LocatorAssertions

| Step | Playwright API |
|---|---|
| `Then the {string} is attached to the DOM` | `toBeAttached()` |
| `Then the {string} is not attached to the DOM` | `not.toBeAttached()` |
| `Then the {string} is empty` | `toBeEmpty()` |
| `Then the {string} is not empty` | `not.toBeEmpty()` |
| `Then the {string} is in the viewport` | `toBeInViewport()` |
| `Then the {string} is not in the viewport` | `not.toBeInViewport()` |
| `Then the text of {string} is {string}` | `toHaveText()` |
| `Then the text of {string} is not {string}` | `not.toHaveText()` |
| `Then the {string} contains the text {string}` | `toContainText()` |
| `Then the {string} does not contain the text {string}` | `not.toContainText()` |
| `Then the {string} has the class {string}` | `toHaveClass()` |
| `Then the {string} does not have the class {string}` | `not.toHaveClass()` |
| `Then the {string} contains the class {string}` | `toContainClass()` |
| `Then the {string} does not contain the class {string}` | `not.toContainClass()` |
| `Then the {string} has {int} elements` | `toHaveCount()` |
| `Then the CSS property {string} of {string} equals {string}` | `toHaveCSS()` |
| `Then the {string} has the ID {string}` | `toHaveId()` |
| `Then the {string} has the role {string}` | `toHaveRole()` |
| `Then the {string} does not have the role {string}` | `not.toHaveRole()` |
| `Then the {string} has the accessible name {string}` | `toHaveAccessibleName()` |
| `Then the {string} does not have the accessible name {string}` | `not.toHaveAccessibleName()` |
| `Then the {string} has the accessible description {string}` | `toHaveAccessibleDescription()` |
| `Then the {string} does not have the accessible description {string}` | `not.toHaveAccessibleDescription()` |
| `Then the {string} has the accessible error message {string}` | `toHaveAccessibleErrorMessage()` |
| `Then the {string} does not have the accessible error message {string}` | `not.toHaveAccessibleErrorMessage()` |
| `Then the {string} has the JS property {string} with value {string}` | `toHaveJSProperty()` |
| `Then the selected values of {string} include {string}` | `toHaveValues()` *(kommagetrennt)* |
| `Then the {string} matches the screenshot {string}` | `toHaveScreenshot(name)` |
| `Then the {string} matches the snapshot` | `toHaveScreenshot()` |

### PageAssertions

| Step | Playwright API |
|---|---|
| `Then the page title equals {string}` | `toHaveTitle()` |
| `Then the page title is not {string}` | `not.toHaveTitle()` |
| `Then the page title contains {string}` | `toHaveTitle(RegExp)` |
| `Then the page matches the screenshot {string}` | `page.toHaveScreenshot(name)` |
| `Then the page matches the snapshot` | `page.toHaveScreenshot()` |
