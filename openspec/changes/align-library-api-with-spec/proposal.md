## Why

The TypeScript library has an initial implementation, but its exported API does not consistently match the canonical `spec.md` contract. This creates ambiguity for consumers and makes the existing browser examples validate legacy helper behavior rather than the library that will be published. Aligning the API now provides a stable foundation before expanding packaging or advanced lifecycle features.

## What Changes

- **BREAKING**: Make `launchExtensionContext` use the documented `LaunchExtensionOptions` object as its public input.
- Align all public helper signatures and return types with `spec.md`.
- Support both string expressions and callback predicates in `waitForDelivery`.
- Keep generic extension-page and side-panel navigation independent from extension-specific runtime message names.
- Expose configurable launch options through the Playwright fixtures.
- Add black-box Playwright coverage that exercises the exported TypeScript library against local unpacked Manifest V3 extensions.
- Update consumer documentation and migration guidance for the breaking launcher signature.
- Preserve a documented rollback path for consumers that still use the current launcher signature.

## Capabilities

### New Capabilities

- `extension-testing-library-api`: Provides the stable, typed lifecycle, page, assertion, diagnostics, messaging, and fixture APIs for browser-extension integration tests.

### Modified Capabilities

None.

## Impact

- Affected source: `src/types.ts`, `src/lifecycle.ts`, `src/messaging.ts`, `src/fixtures.ts`, and related exports.
- Affected validation: Playwright integration tests under `tests/`, using the existing local extension cores as black-box fixtures.
- Affected documentation: `README_PLAYWRIGHT.md` and API usage examples.
- Affected generated output: TypeScript declarations and JavaScript under `dist/` after implementation.
- No new runtime dependency is required; the change continues to use Playwright and Chromium CDP.
