# AI Agent Guidance

## Repository Goal

This repository is a reusable Playwright integration-testing scaffold for browser extensions. Its primary goal is to test extension behavior through real browser interactions and human-readable assertions. Tests must remain independent of any specific extension core or framework so the helpers and workflow can be reused with any compatible extension.

Use Playwright for extension tests. Treat the extension as a black box: drive the browser, interact with visible UI, observe navigation and messages, and validate user-visible outcomes. Do not replace browser flows with unit tests or direct imports from the extension under test.

## Related Guides

Use these documents together:

- [README_PLAYWRIGHT.md](README_PLAYWRIGHT.md): repository overview, setup, helpers, and examples.
- [TEST_WORKFLOW.md](TEST_WORKFLOW.md): step-by-step workflow for turning a user story into a test.
- [TEST_CASE_TEMPLATE.md](TEST_CASE_TEMPLATE.md): format for documenting a test scenario before implementation.
- [tests/playwright-extension-helpers.js](tests/playwright-extension-helpers.js): shared browser, action, and assertion helpers.
- [tests/playwright-extension.spec.js](tests/playwright-extension.spec.js): generic example test and starting point for adapting a flow.

When guidance overlaps, keep the behavior consistent with this file: use Playwright, reuse helpers, keep tests black-box, and avoid coupling tests to a bundled extension implementation.

## Workspace Overview

The workspace contains a reusable test harness and sample extension cores:

- `tests/` contains the Playwright specs, shared helpers, and extension-specific examples.
- `extension_cores/` contains local sample extensions used as fixtures and demonstrations. They are not required by the test architecture.

## Setup And Commands

Install Playwright and its browser once in this repository:

- `npm install`
- `npx playwright install chromium`

Run the generic example or a selected test with Node:

- `node tests/playwright-extension.spec.js`
- `node tests/stateless_messages/playwright-extension-worker-resilience.spec.js`
- `node tests/stateless_messages/playwright-extension-diagnostic.spec.js`
- `node tests/stateless_messages/run-all-tests.js`

To test another extension, pass its unpacked extension directory to the applicable test or adapt the fixture path in the test. Do not hardcode extension IDs.

## Test Creation

For each user story:

1. Read [TEST_WORKFLOW.md](TEST_WORKFLOW.md) and capture the scenario with [TEST_CASE_TEMPLATE.md](TEST_CASE_TEMPLATE.md).
2. Identify the pages, extension views, user actions, external effects, and user-visible assertions involved.
3. Reuse existing local fixtures, mocks, and helpers before creating new assets.
4. Implement the flow as Arrange, Act, and Assert steps in a Playwright test.
5. Validate the expected UI, navigation, extension state, and console behavior.

Tests must exercise the extension through the browser. Do not import extension modules, inspect private state, or substitute unit tests for a browser flow unless the user explicitly requests an implementation-level test.

## Fixtures And Mocks

- Never use external websites or production, staging, or third-party APIs.
- Use local pages and Playwright route interception for deterministic tests.
- Reuse an existing fixture before extending it; create a minimal new fixture only when needed.
- Give fixtures stable `data-testid` attributes and realistic user-facing navigation.
- Store new mocks beside the relevant test or in the repository's established mock directory. Do not assume a `playwright/mocks` directory exists.

## Selectors And Assertions

- Prefer stable `data-testid` selectors over layout selectors such as `div:nth-child(3)`.
- Prefer the shared helpers in [tests/playwright-extension-helpers.js](tests/playwright-extension-helpers.js) over custom wrappers.
- Prefer `assertTextContains()` over manually reading `locator.textContent()`.
- Prefer `assertSelectorVisible()` over raw `page.waitForSelector()` when visibility is the behavior being tested.
- Prefer `assertUrlContains()` over custom URL checks.
- Avoid arbitrary sleeps; use `delay()` only when no meaningful browser assertion can express the wait.
- Include a no-console-errors assertion when the flow captures console entries.

## Test Naming

Use the format `[Feature] - [Expected Behavior]`, for example:

- `Dashboard - Synchronizes when the extension opens a page`
- `Prospect Matching - Opens a matched prospect`
- `Authentication - User login succeeds`

## Forbidden Patterns

Do not:

- Duplicate helper or mock logic.
- Hardcode extension IDs.
- Depend on network access.
- Use arbitrary sleep calls when a browser assertion can express the wait.
