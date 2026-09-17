# Technical Specification: Playwright Browser Extension Testing Framework

## 1. Overview

This framework provides a TypeScript-native, human-centered testing suite and helper collection for Chromium browser extensions (Manifest V3) built with React.

It abstracts complex Chromium DevTools Protocol (CDP) interactions, background service worker lifecycles, and cross-context messaging into clear, expressive Playwright integration tests.

The framework is published as an exportable library:

```text
@scope/playwright-extension-testing
```

Tests can run against local unpacked extension builds.

---

## 2. Core Architecture & Requirements

### 2.1 Distribution Strategy

| Area           | Requirement                                                                                            |
| -------------- | ------------------------------------------------------------------------------------------------------ |
| Package model  | Exportable npm TypeScript module                                                                       |
| Consumer usage | Test suites import framework fixtures and provide the path to their local unpacked extension directory |
| Example paths  | `./dist`, `./build`                                                                                    |

### 2.2 Target Contexts

The framework should support testing:

* Web pages — content script targets
* Extension side panels — `chrome-extension://<id>/sidepanel.html`
* Background service workers / event pages
* Custom extension pages — `chrome-extension://<id>/*`

---

## 3. TypeScript Domain Types

```typescript
import { BrowserContext, Page } from '@playwright/test';

/**
 * Options for launching a persistent Chromium context
 * with an extension loaded.
 */
export interface LaunchExtensionOptions {
  /** Path to the unpacked extension directory. */
  extensionPath: string;

  /** Custom user data directory for Chromium profile persistence. */
  userDataDir?: string;

  /** Run browser in headless or headed mode. Defaults to false. */
  headless?: boolean;

  /** Browser viewport configuration. Defaults to 1280x800. */
  viewport?: {
    width: number;
    height: number;
  };
}

/**
 * Represents an active extension test session.
 */
export interface ExtensionContextSession {
  context: BrowserContext;
  page: Page;
  extensionId: string;
  extensionPath: string;
}

/**
 * Structured log entry for background and page console tracking.
 */
export interface CapturedConsoleEntry {
  type: string;
  text: string;
  timestamp: number;
}

/**
 * Options for helper assertions with customizable timeouts.
 */
export interface AssertionOptions {
  timeout?: number;
}

/**
 * Cross-context message payload structure.
 */
export interface ExtensionMessage<T = unknown> {
  type: string;
  payload?: T;
  requestId?: string;
}
```

---

# 4. API & Helper Specifications

## 4.1 Lifecycle & Discovery Helpers

### `launchExtensionContext`

```typescript
launchExtensionContext(
  options: LaunchExtensionOptions
): Promise<ExtensionContextSession>
```

Responsibilities:

* Launch a persistent Chromium context.
* Load the unpacked extension using:

  * `--disable-extensions-except`
  * `--load-extension`
* Discover the runtime `extensionId` through CDP using `Target.getTargets`.
* Return the active extension test session.

### `closeContext`

```typescript
closeContext(
  context: BrowserContext
): Promise<void>
```

Gracefully terminates the browser context.

---

## 4.2 Extension Context Helpers

### `openExtensionPage`

```typescript
openExtensionPage(
  context: BrowserContext,
  extensionId: string,
  relativePath: string
): Promise<Page>
```

Opens an extension page in a new tab:

```text
chrome-extension://<extensionId>/<relativePath>
```

### `openExtensionSidePanel`

```typescript
openExtensionSidePanel(
  context: BrowserContext,
  extensionId: string
): Promise<Page>
```

Opens `sidepanel.html` and performs messaging validation to ensure the side panel has initialized correctly.

### `closeServiceWorker`

```typescript
closeServiceWorker(
  context: BrowserContext,
  extensionId: string,
  options?: {
    delayAfterClose?: number;
  }
): Promise<void>
```

Forces background service worker termination.

This allows tests to verify state persistence across service worker restarts, such as:

```text
chrome.storage.session
```

---

## 4.3 Human-Centered Assertions

### `assertSelectorVisible`

```typescript
assertSelectorVisible(
  page: Page,
  selector: string,
  options?: AssertionOptions
): Promise<void>
```

### `assertTextContains`

```typescript
assertTextContains(
  page: Page,
  selector: string,
  expectedText: string,
  options?: AssertionOptions
): Promise<void>
```

### `assertTextEquals`

```typescript
assertTextEquals(
  page: Page,
  selector: string,
  expectedText: string,
  options?: AssertionOptions
): Promise<void>
```

### `assertUrlContains`

```typescript
assertUrlContains(
  page: Page,
  expectedUrlSegment: string,
  options?: AssertionOptions
): Promise<void>
```

### `assertElementCount`

```typescript
assertElementCount(
  page: Page,
  selector: string,
  expectedCount: number,
  options?: AssertionOptions
): Promise<void>
```

These helpers should provide simple, readable assertions for common extension integration test scenarios.

---

## 4.4 Console & Telemetry Diagnostics

### `createConsoleLogger`

```typescript
createConsoleLogger(
  page: Page
): CapturedConsoleEntry[]
```

Listens for page errors and console events, including:

* `console.error`
* `console.warn`
* Other console messages
* Page errors

### `assertNoConsoleErrors`

```typescript
assertNoConsoleErrors(
  entries: CapturedConsoleEntry[]
): void
```

Throws an assertion error if any captured entry has:

```typescript
type === 'error'
```

### `assertConsoleContains`

```typescript
assertConsoleContains(
  entries: CapturedConsoleEntry[],
  expectedText: string
): void
```

Asserts that the captured console output contains the expected text.

---

## 4.5 Inter-Context Messaging

### `sendMessageFromContent`

```typescript
sendMessageFromContent<T, R>(
  page: Page,
  type: string,
  payload?: T,
  options?: AssertionOptions
): Promise<R>
```

Dispatches custom events from a content-script target and waits for a response from background or side-panel listeners.

### `waitForDelivery`

```typescript
waitForDelivery(
  page: Page,
  checkExpression: string | (() => boolean),
  options?: AssertionOptions
): Promise<boolean>
```

Waits until the specified condition is satisfied or the configured timeout is reached.

