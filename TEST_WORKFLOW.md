# Playwright Test Creation Workflow

> Main rule: build black-box Playwright integration tests with human-readable browser steps and assertions. Do not use vitest or direct implementation-level tests for extension behavior.

This workflow is extension-agnostic. Use any local unpacked extension, fixture, or test target that represents the user story. The sample extension cores in `extension_cores/` are optional examples.

Before starting, read [AGENTS.md](AGENTS.md) for repository rules and use [TEST_CASE_TEMPLATE.md](TEST_CASE_TEMPLATE.md) to capture the scenario.

## Step 1

Receive a user story.

Example user story:

"When the user navigates to a prospect detail page, the extension should detect the page, scrape the prospect information, perform a matching request, and open the matched prospect."

---

## Step 2

Identify:

### Pages Or Extension Contexts

* Prospect detail page

### API Endpoints Or External Effects

* prospect-match

### Extension Views

* Prospect Matching

### Assertions

* Prospect data extracted
* Match returned
* Prospect opened

---

## Step 3

Determine Required Assets

Does a required page or extension fixture already exist?

If no:
Create one.

Does a required API mock already exist?

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

## Step 4

Implement Test

Use:

Arrange
Act
Assert

Focus on human-level assertions: click buttons, inspect visible UI, validate user-facing text, and verify navigation or extension state. Reuse helpers from `tests/playwright-extension-helpers.js` whenever possible.

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

Document the scenario using [TEST_CASE_TEMPLATE.md](TEST_CASE_TEMPLATE.md) or the test directory's existing README. Add fixture references when new fixtures are created. Keep documentation links relative and point only to files that exist in this repository.
