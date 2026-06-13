# Playwright Test Creation Workflow

> Main rule: build integration tests with human-readable browser steps and assertions. Do not use vitest for these extension tests.

## Step 1

Receive a user story.

Example:

"When the user navigates to a prospect detail page, the extension should detect the page, scrape the prospect information, perform a matching request, and open the matched prospect."

---

## Step 2

Identify:

### PMS Pages

* Prospect Detail

### API Endpoints

* prospect-match

### Sidepanel Views

* Prospect Matching

### Assertions

* Prospect data extracted
* Match returned
* Prospect opened

---

## Step 3

Determine Required Assets

Does a PMS page already exist?

If no:
Create one.

Does an API mock already exist?

If no:
Create one.

Does a test already exist?

If no:
Create one.

---

## Step 4

Create or Reuse Fixtures

Fixture priority:

1. Existing fixture
2. Extend existing fixture
3. Create new fixture

Avoid duplication.

---

## Step 5

Implement Test

Use:

Arrange
Act
Assert

Focus on human-level assertions: click buttons, inspect UI, validate visible text, and verify navigation state.

sections.

---

## Step 6

Validate

Every test should verify:

* No console errors
* Expected UI state
* Expected navigation state

Recommended final assertions:

assertNoConsoleErrors(consoleEntries)

---

## Step 7

Update Documentation

Add test scenario to:

docs/test-scenarios.md

Add fixture references if new fixtures were created.
