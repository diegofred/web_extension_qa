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

To validate the compiled TypeScript library and its Playwright fixtures:

```bash
npm run build
npm run test:library
npx playwright test tests/library_api_validation/playwright-fixtures.spec.js --workers=1
npm run test:package
```

`test:package` validates the packed artifact in an isolated local consumer. It does not publish the package or contact a production service.

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

This section is the user-facing reference for the helpers in this repository. The TypeScript API is exported from `src/index.ts` and is the recommended API for new tests. The standalone JavaScript helpers in `tests/playwright-extension-helpers.js` are also documented below because existing test scripts use them.

### Installed package setup

External test repositories should use Node.js 20 or newer and install the package alongside its Playwright peer:

```bash
npm install web-extension-qa @playwright/test
```

The package exposes its runtime and TypeScript declarations from the root import. The extension path passed to the helpers is owned by the consuming repository and must point to that repository's unpacked extension build.

```ts
import { expect, launchExtensionContext, test } from 'web-extension-qa';
```

The package metadata supports CommonJS consumers and TypeScript declaration resolution. This repository's `npm run test:package` command validates the same workflow from a local tarball without publishing it.

### TypeScript library API

For repository-local development, import the compiled library from the package entry point after running `npm run build`:

```ts
import {
  assertNoConsoleErrors,
  assertSelectorVisible,
  closeContext,
  launchExtensionContext,
  openExtensionSidePanel,
} from './dist/index.js';
```

#### Browser lifecycle and extension pages

- `launchExtensionContext({ extensionPath, userDataDir?, headless?, viewport? })` — resolves and validates the unpacked extension directory, launches a persistent Chromium context with that extension loaded, creates an initial page, and discovers the extension ID through CDP. It returns `{ context, page, extensionId, extensionPath }`. The options-object form is canonical.
- `findExtensionId(client)` — asks the supplied Playwright CDP session for active targets and returns the first ID found in a `chrome-extension://` target, or `null` when no extension target exists.
- `openExtensionPage(context, extensionId, relativePath)` — creates a new page, navigates it to `chrome-extension://<extensionId>/<relativePath>`, waits for the page to load, and returns the page. Use this for extension pages other than the side panel.
- `openExtensionSidePanel(context, extensionId)` — opens `sidepanel.html` with `openExtensionPage`, waits for `domcontentloaded`, and returns the initialized page.
- `closeServiceWorker(context, extensionId, { delayAfterClose? })` — finds the extension's Manifest V3 service-worker target through CDP, closes it, and waits briefly for Chrome to restart it. Use this to verify state and messaging survive worker restarts.
- `closeContext(context)` — closes the persistent Playwright browser context and releases its pages and resources. Call it in cleanup when you are not using the bundled `test` fixture.

Example lifecycle flow:

```ts
const session = await launchExtensionContext({ extensionPath: './extension_cores/my-extension' });
const sidepanel = await openExtensionSidePanel(session.context, session.extensionId);
await assertSelectorVisible(sidepanel, '[data-testid="app"]');
await closeContext(session.context);
```

#### Browser and DOM assertions

All assertion helpers accept an optional `{ timeout }` in milliseconds. They use Playwright's `expect` and wait for the requested condition instead of reading the DOM once.

- `assertSelectorVisible(page, selector, options?)` — waits until the selector matches a visible element.
- `assertSelectorExists(page, selector, options?)` — waits until the selector is attached to the DOM, whether visible or hidden.
- `assertTextContains(page, selector, expected, options?)` — waits until the selected element's text contains `expected`.
- `assertTextEquals(page, selector, expected, options?)` — waits until the selected element's text exactly equals `expected`.
- `assertUrlContains(page, expected, options?)` — waits until the page URL matches the supplied regular expression.
- `assertElementCount(page, selector, expectedCount, options?)` — waits until exactly `expectedCount` elements match the selector.

Prefer stable `data-testid` selectors and these assertions over arbitrary sleeps or direct `textContent()` checks.

#### Console and page-error helpers

- `createConsoleLogger(page)` — attaches listeners for browser console messages and uncaught page errors, returning a live array of `{ type, text, timestamp }` entries. Create the logger before the interaction you want to observe.
- `assertNoConsoleErrors(entries)` — throws when any captured entry has type `error`; use it at the end of a flow that must be clean.
- `assertConsoleContains(entries, expectedText)` — throws unless at least one captured entry contains the expected text.

```ts
const entries = createConsoleLogger(sidepanel);
// ...perform browser interactions...
assertNoConsoleErrors(entries);
```

#### Runtime messaging and delivery

- `sendMessageFromContent(page, type, payload?, options?)` — dispatches the library's content-script bridge event inside the page, waits for the matching response, and returns the response. The optional timeout defaults to 5 seconds and the generic parameters can type the payload and response.
- `waitForDelivery(page, expressionOrPredicate, options?)` — repeatedly evaluates a string expression or serializable predicate in the page until it returns a truthy value. It checks every 100ms and throws after the optional timeout (5 seconds by default).

### Standalone JavaScript helpers

`tests/playwright-extension-helpers.js` contains the original CommonJS helper set used by the Node-based example tests. It provides the same lifecycle, assertion, console, messaging, and delivery helpers described above, plus these convenience helpers:

- `openUrl(page, url, options?)` — navigates to a URL, first waiting for `domcontentloaded` by default and retrying with `load` if the first navigation fails.
- `waitForText(page, selectorOrText, options?)` — waits for a selector, including Playwright's `text=` selector form.
- `clickText(page, text, options?)` — clicks the first element matching `text=<text>`.
- `clickSelector(page, selector, options?)` — clicks the supplied CSS selector.
- `delay(ms)` — resolves after the requested number of milliseconds. Use only when no meaningful browser condition can express the wait.

The JavaScript helper names are intentionally kept for backwards compatibility. New TypeScript tests should prefer the typed library API and the bundled `test` fixture.

### Playwright fixture

- `test` — a Playwright `test.extend` fixture that provides `extensionPath` (default `./dist`), `extensionLaunchOptions`, `extensionContext`, `extensionId`, and `sidepanelPage`. The fixture launches and closes the browser context automatically.
- `expect` — re-exported from `@playwright/test` so fixture-based tests can import both `test` and `expect` from the library.

Example fixture usage:

```ts
import { expect, test } from 'web-extension-qa';

test('Side panel - renders the application', async ({ sidepanelPage }) => {
  await expect(sidepanelPage.locator('[data-testid="app"]')).toBeVisible();
});
```

## TypeScript library migration

The public TypeScript API now uses an options object:

```ts
const session = await launchExtensionContext({
  extensionPath: './dist',
  headless: false,
  viewport: { width: 1280, height: 800 },
});
```

Replace the former `launchExtensionContext(extensionPath, options)` call with the equivalent object form. Extension-specific runtime messages such as `OPEN_SIDE_PANEL` belong in consumer tests rather than generic library lifecycle helpers.

## Package compatibility

- Supported Node.js runtime: 20 or newer.
- Supported Playwright peer: `@playwright/test` `^1.63.0`.
- This repository prepares and validates the package locally; it does not publish to npm automatically.

## Notes

- If the script cannot discover the `extensionId`, open the extension manually in Chromium and find its ID at `chrome://extensions`.
- The test runs with `headless: false` by default because the sidepanel UI and extensions often require a visible browser.
- To run without a UI, change `headless: false` to `true` in `tests/playwright-extension-helpers.js`.
