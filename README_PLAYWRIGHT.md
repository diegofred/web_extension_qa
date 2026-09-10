# Playwright extension test scaffold

This repository is a reusable Playwright test scaffold for validating browser extensions in a repeatable, human-centered way. It is intentionally independent of any specific extension core or framework. The bundled extension cores are local examples and fixtures, not application dependencies.

> Main rule: use Playwright integration tests with human-level browser interactions and assertions, not unit tests that import or inspect the extension implementation directly.

See [AGENTS.md](AGENTS.md) for repository rules, [TEST_WORKFLOW.md](TEST_WORKFLOW.md) for the test-creation process, and [TEST_CASE_TEMPLATE.md](TEST_CASE_TEMPLATE.md) for documenting scenarios.

## How It Works

The test in `tests/playwright-extension.spec.js` does the following:

1. Loads Chromium with the extension unpacked from a local directory.
2. Discovers the extension ID at `chrome-extension://<id>/...` through the CDP protocol.
3. Opens a test page (`https://example.com`) and verifies that the injected content script added the expected button.
4. Clicks the injected button to validate the `content script -> background -> sidepanel` communication flow.
5. Opens `sidepanel.html` directly from the extension context.
6. Verifies the presence of key sidepanel elements (`#title`, `#refresh`, `#send`, `#messages`).
7. Requests that the background open the sidepanel through a message, similar to clicking the extension action.
8. Performs actions in the sidepanel: clicking `Refresh` and clicking `Send To Content`.
9. Captures and verifies console errors to ensure there are no visible failures.

## Main Files

- `tests/playwright-extension-helpers.js`
  - Contains generic helpers for launching Chromium with the extension loaded.
  - Provides reusable functions for navigation, selector and text validation, element counts, and console capture.
  - Designed for use with any compatible extension.

- `tests/playwright-extension.spec.js`
  - Generic example test script that uses the helpers.
  - Demonstrates browser-driven assertions for content script injection and sidepanel behavior.

## Test Coverage

- `launchExtensionContext`: launches Chromium with `--load-extension` and `--disable-extensions-except`.
- Automatic detection of `extensionId` using CDP.
- Opening a regular web page and verifying that the content script injected the expected button.
- Interaction with the content script to send a message to the panel.
- Opening the sidepanel page and validating its DOM structure.
- Verifying that there are no console errors in the sidepanel.

## Running the Test

1. Install Playwright and Chromium in the workspace:

```bash
npm init -y
npm i -D playwright
npx playwright install chromium
```

2. Run the generic test script:

```bash
node tests/playwright-extension.spec.js
```

3. To test another extension, pass its directory as an argument:

```bash
node tests/playwright-extension.spec.js ../path/to/your/extension
```

## Service Worker Resilience Tests

The `tests/stateless_messages/playwright-extension-worker-resilience.spec.js` file verifies that messages persist even when the service worker restarts:

```bash
node tests/stateless_messages/playwright-extension-worker-resilience.spec.js
```

This test:
1. Sends messages from the content script
2. Forces the service worker to restart by closing the background context
3. Sends more messages after the restart
4. Verifies that `chrome.storage.session` persists correctly

The `tests/stateless_messages/playwright-extension-diagnostic.spec.js` file is a diagnostic tool that directly inspects the state of `chrome.storage.session`:

```bash
node tests/stateless_messages/playwright-extension-diagnostic.spec.js
```

This is useful for verifying that messages are being stored correctly in the extension.

## Test runner

To run all tests in an organized sequence:

```bash
node tests/stateless_messages/run-all-tests.js
```

This runs the following tests sequentially:
- Generic extension assertions
- Service worker resilience tests
- Storage diagnostic inspection

## Test-Specific Documentation

Each extension has its own test directory with detailed documentation:

- [tests/stateless_messages/README.md](tests/stateless_messages/README.md) — Complete test case guide for the `stateless_messages` extension

## Adapting To Other Extensions

When testing another extension, keep the shared helpers and replace only the fixture-specific flow in the test. If the extension uses different selectors or button names, update `tests/playwright-extension.spec.js` to:

- change the selector for the button injected by the content script
- change the sidepanel selectors (`#title`, `#refresh`, `#send`, `#messages`)
- add additional DOM or extension-specific content assertions

You can reuse `tests/playwright-extension-helpers.js` in other projects because it contains generic Playwright utilities and does not depend on a particular extension core.

## Available Helper Reference

- `launchExtensionContext(extensionPath, options)` — launches Chromium with the extension loaded and returns the context, an initial page, and the detected `extensionId`.
- `findExtensionId(client)` — searches for a `chrome-extension://` target using CDP and returns the extension ID.
- `openUrl(page, url, options)` — navigates to a URL with configurable timeouts.
- `assertSelectorVisible(page, selector, options)` — waits for a selector to exist and be visible.
- `assertSelectorExists(page, selector, options)` — waits for a selector to be present in the DOM, even if it is not visible.
- `assertTextContains(page, selector, expected, options)` — verifies that a selector's text contains the expected string.
- `assertTextEquals(page, selector, expected, options)` — verifies that a selector's text exactly matches the expected string.
- `assertUrlContains(page, expected, options)` — verifies that the page's current URL contains the expected fragment.
- `assertElementCount(page, selector, expectedCount, options)` — verifies the number of elements matching a selector.
- `assertNoConsoleErrors(entries)` — verifies that no console entries have type `error`.
- `clickText(page, text, options)` — clicks an element identified by its text.
- `clickSelector(page, selector, options)` — clicks an element identified by a CSS selector.
- `createConsoleLogger(page)` — collects console entries and page errors in an array.
- `assertConsoleContains(entries, expectedText)` — verifies that a console message containing the expected text exists.
- `openExtensionPage(context, extensionId, relativePath)` — opens an internal extension page using `chrome-extension://<id>/<path>`.
- `openExtensionSidePanel(context, extensionId)` — asks the background to open the sidepanel as if the extension action had been clicked.
- `closeServiceWorker(context, extensionId, options)` — forces the service worker to close and restart by navigating to its context and closing the page.
- `delay(ms)` — utility for waiting a specified number of milliseconds.
- `closeContext(context)` — closes the Playwright context.

## Notes

- If the script cannot discover the `extensionId`, open the extension manually in Chromium and find its ID at `chrome://extensions`.
- The test runs with `headless: false` by default because the sidepanel UI and extensions often require a visible browser.
- To run without a UI, change `headless: false` to `true` in `tests/playwright-extension-helpers.js`.
