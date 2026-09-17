## 1. Contract and Type Surface

- [x] 1.1 Add or update Playwright-facing contract scenarios for the options-object launcher, invalid paths, optional launch settings, and returned session fields; verify the scenarios identify the current signature mismatches before implementation.
- [x] 1.2 Update the public TypeScript types and lifecycle declaration shape so `launchExtensionContext(options: LaunchExtensionOptions)` is canonical and all documented helper return types are explicit; verify with `npm run build` and generated declaration inspection.
- [x] 1.3 Update repository consumers and examples to call the options-object launcher; verify no tracked library consumer uses the removed path-first signature.

## 2. Generic Lifecycle and Fixture Behavior

- [x] 2.1 Add a browser scenario that opens a custom extension page and `sidepanel.html` without relying on `OPEN_SIDE_PANEL`; verify the expected `chrome-extension://` URLs and visible page readiness.
- [x] 2.2 Refactor lifecycle helpers so side-panel navigation has no fixed extension-specific message dependency while preserving extension ID discovery and launch error reporting; verify the generic lifecycle scenario passes against the local extension fixture.
- [x] 2.3 Add fixture cleanup coverage that deliberately fails a fixture-backed test and verifies owned pages and the persistent context are closed; verify with the focused Playwright fixture test.
- [x] 2.4 Expose documented launch configuration through the Playwright fixture API; verify a consumer can override the extension path, headless mode, viewport, and profile directory in a browser run.

## 3. Messaging and Diagnostics

- [x] 3.1 Add black-box messaging scenarios for successful content-page responses, timeout cleanup, and callback-based delivery predicates; verify the scenarios fail before the implementation changes when the behavior is missing.
- [x] 3.2 Update `waitForDelivery` to accept string expressions and serializable callback predicates with shared timeout and polling behavior; verify focused messaging tests and TypeScript compilation pass.
- [x] 3.3 Validate console capture, page-error capture, no-console-error assertions, and expected-console matching through the public library entry point; verify normal flows report no unexpected errors.

## 4. Service-Worker Resilience

- [x] 4.1 Add or adapt a Playwright scenario that sends a browser-visible message before and after service-worker termination; verify state or delivery remains observable after restart.
- [x] 4.2 Update the service-worker close helper only as needed to satisfy the documented Manifest V3 restart scenario; verify the focused worker-resilience test passes without introducing extension-specific assumptions.

## 5. Documentation and Generated Output

- [x] 5.1 Update `README_PLAYWRIGHT.md` with the canonical options-object API, fixture configuration, generic side-panel behavior, and migration guidance from the path-first launcher; verify every referenced file and example exists.
- [x] 5.2 Build the package and inspect generated `dist/` declarations and runtime exports; verify the public entry point exposes the documented helpers and no stale declaration retains the removed canonical signature.
- [x] 5.3 Run the focused library validation tests, then the repository test command and build; verify failures are limited to known unrelated issues or resolve them before marking the change complete.
