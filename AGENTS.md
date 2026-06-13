# AI Agent Guidance

## Workspace overview
This workspace contains two separate projects:

- `extension_cores/stateless_messages`
  - Chrome extension using Manifest V3
  - Contains `background.js`, `content.js`, `sidepanel.html`, `sidepanel.js`, and `manifest.json`
  - Uses runtime messaging and a side panel with no build step

- `reducers-educativo`
  - React + TypeScript + Vite application
  - Main source under `reducers-educativo/src`
  - Uses `package.json` scripts for development and build

## Key commands

For `reducers-educativo`:

- `npm install`
- `npm run dev`
- `npm run build`
- `npm run preview`

For `extension_cores/stateless_messages`:

- Load the folder as an unpacked extension in Chrome/Edge
- Update `manifest.json` and the JS/HTML files directly
- No project-level package scripts are present

## Important notes for AI agents

- Treat `extension_cores/stateless_messages` as a browser extension, not a bundled web app.
- Treat `reducers-educativo` as a standard Vite React TypeScript project.
- Keep fixes local to the relevant folder unless the task explicitly spans both projects.
- Do not assume root-level dependencies or scripts outside `reducers-educativo`.

## Useful files

- `extension_cores/stateless_messages/manifest.json`
- `extension_cores/stateless_messages/background.js`
- `extension_cores/stateless_messages/content.js`
- `extension_cores/stateless_messages/sidepanel.html`
- `reducers-educativo/package.json`
- `reducers-educativo/src/App.tsx`
- `reducers-educativo/src/main.tsx`
- `reducers-educativo/vite.config.ts`


# Chrome Extension E2E Testing Agent Instructions

## Purpose

This repository contains an integration testing framework for a Chrome Extension using Playwright.

The goal of the agent is to transform user stories and test scenarios into executable Playwright test suites.

The main rule is: write integration tests with human-facing assertions and browser-driven flows. Avoid unit-test frameworks such as vitest for this extension testing scaffold.

The generated tests must use existing helper functions whenever possible.

The agent should prioritize readability, maintainability, and reuse.

---

# Architecture

Tests are organized around:

* Extension behavior
* PMS simulation
* Backend API mocking
* Sidepanel interactions
* Scraping workflows
* Authentication workflows

The extension is always tested as a black box.

The implementation details of the extension should not be accessed directly unless explicitly required.

---

# Primary Workflow

When a new test request is received:

0. Remember the main rule: this is integration testing with human assertions, not vitest-style unit testing.
1. Read the user story.
2. Identify:

   * PMS pages involved
   * Backend APIs involved
   * Extension views involved
   * Scraping requirements
   * Assertions required
3. Check if fixtures already exist.
4. Check if API mocks already exist.
5. Check if PMS pages already exist.
6. Reuse helpers whenever possible.
7. Create only missing assets.
8. Generate or update Playwright tests.

---

# Required Test Structure

Every test should follow:

Arrange
→ Mock APIs
→ Open PMS page
→ Open extension
→ Perform user actions

Act
→ Navigate
→ Click
→ Trigger scraping
→ Trigger extension actions

Assert
→ Validate UI
→ Validate navigation
→ Validate API results
→ Validate sidepanel state

---

# Existing Helper Functions

Always prefer these helpers over custom implementations.

## Browser

launchExtensionContext(...)
findExtensionId(...)
closeContext(...)

## Navigation

openUrl(...)

## Extension

openExtensionPage(...)
openExtensionSidePanel(...)

## User Actions

clickSelector(...)
clickText(...)

## Assertions

assertSelectorVisible(...)
assertSelectorExists(...)
assertTextContains(...)
assertTextEquals(...)
assertUrlContains(...)
assertElementCount(...)

## Console Validation

createConsoleLogger(...)
assertConsoleContains(...)
assertNoConsoleErrors(...)

## Utilities

delay(...)
closeServiceWorker(...)

---

# Preferred Assertions

Prefer:

assertTextContains()

instead of manual locator.textContent()

Prefer:

assertSelectorVisible()

instead of page.waitForSelector()

Prefer:

assertUrlContains()

instead of custom URL checks.

---

# PMS Simulation Rules

Never use external websites.

Always use local PMS fixtures.

Supported PMS fixtures:

* Generic PMS
* AppFolio
* Yardi
* RentManager

If a fixture does not exist:

Create a minimal version.

The fixture must include:

* Stable selectors
* Test IDs
* Realistic navigation

---

# Mocking Rules

All APIs must be mocked.

No test should depend on:

* Production APIs
* Staging APIs
* Third-party APIs

Use Playwright route interception.

Mock responses must live under:

playwright/mocks

---

# Selector Rules

Prefer:

data-testid

Example:

[data-testid="prospect-email"]

Avoid:

div:nth-child(3)

Avoid:

CSS selectors based on visual layout.

---

# Test Naming Convention

Format:

[Feature] - [Expected Behavior]

Examples:

Dashboard - Synchronizes when PMS dashboard opens

Prospect Matching - Opens matched prospect

Authentication - User login succeeds

---

# Forbidden Patterns

Do not:

* Duplicate helper logic
* Duplicate mocks
* Hardcode extension IDs
* Depend on network access
* Use arbitrary sleep() calls

Always prefer:

delay()

Only when a proper assertion is not possible.
