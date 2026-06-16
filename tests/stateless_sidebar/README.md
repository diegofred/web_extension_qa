# Test Cases for Stateless Sidebar Extension

This directory contains Playwright integration tests for the `stateless_sidebar` extension.

## Overview

The suite validates resilience of the injected toggle button and tab-scoped panel intent:

- Open state transition (`Show Panel` -> `Hide Panel`)
- Close state transition (`Hide Panel` -> `Show Panel`)
- Rapid sequential toggles remain stable
- Per-tab state isolation
- State persistence after page reload
- Console health checks (no unexpected errors)

## Files

- `TEST_CASES.md`
  - Template-formatted test case definitions.

- `playwright-sidebar-toggle-resilience.spec.js`
  - Executable Playwright resilience flow for stateless sidebar behavior.

- `run-all-tests.js`
  - Small runner to execute the suite and print pass/fail summary.

## Setup

From repository root (`web_extension_qa`):

```bash
npm install
npx playwright install
```

## Run

Run the stateless sidebar suite:

```bash
node tests/stateless_sidebar/run-all-tests.js
```

Run the single resilience test directly:

```bash
node tests/stateless_sidebar/playwright-sidebar-toggle-resilience.spec.js
```

## Notes

- Tests use a local HTTP fixture server (no external websites).
- Extension is loaded unpacked from:
  - `extension_cores/stateless_sidebar`
- If Playwright reports a missing browser executable, rerun:

```bash
npx playwright install
```
