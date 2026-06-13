# Test Cases for Stateless Messages Extension

This directory contains Playwright test suites for the `stateless_messages` extension (Manifest V3).

## Overview

The test scaffold validates:
- Content script injection and messaging
- Service worker resilience (message persistence after restart)
- Sidepanel UI and message queue display
- Extension lifecycle and storage isolation

## Test Scripts

### `playwright-extension.spec.js` — Generic Extension Assertions

Runs a complete flow validation:

```bash
cd .. && node stateless_messages/playwright-extension.spec.js
```

**What it validates:**
1. Extension loads and exposes `chrome-extension://<id>/` target
2. Content script injects UI button on web pages
3. Message routing from content script → background → sidepanel works
4. Sidepanel UI elements exist and are accessible
5. No console errors in extension pages

**Output:** Pass/fail assertions with detailed logging.

### `playwright-extension-worker-resilience.spec.js` — Service Worker Restart

Validates that messages persist across service worker restarts:

```bash
cd .. && node stateless_messages/playwright-extension-worker-resilience.spec.js
```

**What it validates:**
1. **Test Case 1:** Basic message flow before any worker restart
2. **Test Case 2:** Messages survive service worker unload/reload cycle
3. **Test Case 3:** Multiple rapid messages after worker restart are queued correctly

**Key insight:** The extension uses `chrome.storage.session` for queue persistence, which survives worker restarts. Messages are stored with key format: `queue:tab:<tabId>`.

**Output:** Per-test assertions showing message counts and persistence validation.

### `playwright-extension-diagnostic.spec.js` — Storage Inspection

Diagnostic tool to inspect `chrome.storage.session` state:

```bash
cd .. && node stateless_messages/playwright-extension-diagnostic.spec.js
```

**What it does:**
1. Sends a message from content script
2. Inspects full `chrome.storage.session` object
3. Lists all queue keys and their contents
4. Shows the mapping between tab IDs and queued messages
5. Validates the sidepanel can access stored messages

**Useful for:** Debugging message routing, verifying storage state, understanding queue structure.

**Sample output:**
```
Found 1 queue key(s): [ 'queue:tab:746048288' ]
  queue:tab:746048288: [
    {
      payload: {
        message: 'Hello from content',
        ts: 1781325680056,
        url: 'https://example.com/'
      },
      ts: 1781325680057
    }
  ]
```

## Setup

Before running tests, install dependencies in the parent directory:

```bash
cd ..
npm install -D playwright
npx playwright install chromium
```

## Test Architecture

All tests use a shared helper library at `../playwright-extension-helpers.js` with generic utilities:

- `launchExtensionContext(extensionPath)` — starts Chromium with extension loaded
- `openUrl(page, url)` — navigates to a website
- `clickText(page, text)` — clicks an element by text
- `openExtensionPage(context, extensionId, path)` — opens extension pages
- `closeServiceWorker(context, extensionId)` — forces worker restart
- `delay(ms)` — wait utility
- Console capture and validation functions

See `../playwright-extension-helpers.js` for full API.

## Extending Tests

To add new test cases for `stateless_messages`:

1. Import helpers: `const { launchExtensionContext, ... } = require('../playwright-extension-helpers');`
2. Launch context: `const { context, extensionId } = await launchExtensionContext('../extension_cores/stateless_messages');`
3. Use helpers for navigation, assertions, and actions
4. Always close context: `await closeContext(context);`

Example:

```javascript
const { context, extensionId } = await launchExtensionContext('../extension_cores/stateless_messages');
const testPage = await context.newPage();
await openUrl(testPage, 'https://example.com');
await assertSelectorVisible(testPage, 'text=Send To Panel');
await closeContext(context);
```

## Known Limitations

- **Sidepanel display in tests:** The sidepanel queue only shows messages for the currently active tab. When the sidepanel is opened directly via `chrome-extension://<id>/sidepanel.html`, it queries the active tab (which is the sidepanel itself), so the queue appears empty. This is expected behavior and not a bug.
  
- **Session storage scope:** Messages are stored per-tab via `chrome.storage.session`, which is cleared when the browser context closes. This is by design for privacy.

## Running All Tests

Execute all tests sequentially:

```bash
node run-all-tests.js
```

Or run individual tests:

```bash
node playwright-extension.spec.js
node playwright-extension-worker-resilience.spec.js
node playwright-extension-diagnostic.spec.js
```

The test runner script will execute each test with labeled output and continue to the next test even if one fails.
