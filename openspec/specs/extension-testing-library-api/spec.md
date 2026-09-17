# extension-testing-library-api Specification

## Purpose

Provides a stable, typed, browser-driven API for testing Manifest V3 extensions across web pages, extension pages, side panels, service workers, and cross-context messaging.

## Requirements

### Requirement: Consumers can launch a typed extension test session

The library SHALL accept a `LaunchExtensionOptions` object containing an unpacked extension path and optional profile, headless, and viewport settings, launch a persistent Chromium context with that extension loaded, discover the runtime extension ID, and return the context, an initial page, extension ID, and resolved extension path.

#### Scenario: Launch with required options
- **WHEN** a consumer provides a valid unpacked extension path
- **THEN** the library launches a persistent Chromium context, discovers the extension ID, and returns an active extension test session

#### Scenario: Launch with optional settings
- **WHEN** a consumer provides a custom user-data directory, headless setting, or viewport
- **THEN** the launched context uses those settings while preserving extension loading and ID discovery

#### Scenario: Launch with an invalid extension path
- **WHEN** the provided extension path does not exist
- **THEN** the library rejects the launch with an error identifying the resolved path

### Requirement: Consumers can open extension contexts generically

The library SHALL open custom extension pages and the side-panel page using the discovered extension ID without requiring extension-specific runtime message names or private extension implementation details.

#### Scenario: Open a custom extension page
- **WHEN** a consumer provides an extension ID and relative page path
- **THEN** the library opens a new page at the corresponding `chrome-extension://` URL and returns it

#### Scenario: Open the side panel page
- **WHEN** a consumer opens the extension side panel through the library
- **THEN** the library navigates to `sidepanel.html`, waits for it to initialize, and returns the page without requiring a fixed background message contract

### Requirement: Consumers can use human-centered assertions and diagnostics

The library SHALL provide typed helpers for selector visibility, text containment, exact text, URL fragments, element counts, console capture, absence of console errors, and expected console output.

#### Scenario: Assert visible user-facing state
- **WHEN** a consumer checks a selector, text value, URL fragment, or element count
- **THEN** the helper waits up to the configured timeout and succeeds only when the requested browser-visible condition is met

#### Scenario: Capture and reject page failures
- **WHEN** a tracked page emits console messages or page errors
- **THEN** the logger records typed entries with text and timestamps, and the no-console-errors assertion rejects entries whose type is `error`

### Requirement: Consumers can coordinate cross-context delivery

The library SHALL provide typed content-page message dispatch and delivery polling with configurable timeouts. `waitForDelivery` SHALL accept either a string expression or a serializable callback predicate.

#### Scenario: Send a content-page message and receive a response
- **WHEN** a consumer dispatches a typed message from a content page and the extension responds through the agreed browser event bridge
- **THEN** the helper resolves with the typed response before the timeout

#### Scenario: Delivery does not occur
- **WHEN** no matching response or predicate result is observed before the configured timeout
- **THEN** the helper rejects with a delivery timeout error and removes any temporary listeners

#### Scenario: Poll with a callback predicate
- **WHEN** a consumer supplies a serializable callback that becomes truthy in the target page
- **THEN** the helper returns `true` after observing that browser-visible condition

### Requirement: Consumers can use configurable Playwright fixtures

The library SHALL provide Playwright fixtures that expose an extension path option, an active extension context, the discovered extension ID, and an initialized side-panel page, and SHALL close owned pages and contexts during teardown.

#### Scenario: Run a test with the extension fixture
- **WHEN** a consumer configures an unpacked extension path and runs a Playwright test
- **THEN** the fixtures launch the extension, expose the discovered context and ID, and provide a usable side-panel page

#### Scenario: Test cleanup after failure
- **WHEN** a fixture-backed test throws an assertion error
- **THEN** fixture teardown still closes the side-panel page and persistent browser context it owns

### Requirement: The public API is validated through black-box browser tests

The repository SHALL validate the exported library behavior with Playwright flows against local unpacked extension fixtures and SHALL avoid replacing extension behavior tests with direct imports of extension implementation modules.

#### Scenario: Validate a normal extension flow
- **WHEN** the library validation suite launches a local fixture, interacts with a web page and extension page, and captures diagnostics
- **THEN** it verifies the expected user-visible state and absence of console errors

#### Scenario: Validate service-worker resilience
- **WHEN** the validation suite closes and restarts the extension service worker during a browser flow
- **THEN** it verifies that the documented extension behavior remains observable after the restart
