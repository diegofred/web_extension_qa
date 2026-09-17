## Context

The existing TypeScript implementation is split across lifecycle, assertion, messaging, and fixture modules, while the current browser examples primarily consume a separate JavaScript helper module. The canonical contract in `spec.md` describes a consumer-facing options-object launcher and generic extension contexts, but the implementation currently exposes a path-first launcher and embeds an extension-specific `OPEN_SIDE_PANEL` message assumption.

## Goals / Non-Goals

**Goals:**

- Make the exported TypeScript API match the signatures and behavior described in `spec.md`.
- Keep the core helpers extension-agnostic across content pages, side panels, custom extension pages, and Manifest V3 service workers.
- Validate the public API through real Playwright browser flows using local unpacked extension fixtures.
- Make fixture launch configuration explicit and consumer-controlled.

**Non-Goals:**

- Publishing the package or finalizing npm branding.
- Adding a new messaging protocol to extensions under test.
- Implementing a general-purpose service-worker lifecycle abstraction beyond the documented close-and-restart helper.
- Replacing the existing sample-extension scenarios with extension-specific unit tests.

## Decisions

### 1. Use the options object as the canonical launcher API

`launchExtensionContext` will accept `LaunchExtensionOptions` directly. The extension path, profile directory, headless mode, and viewport will be validated and normalized in one place. This matches the documented consumer contract and makes future launch options additive.

The current path-first call form will be treated as a breaking API removal rather than an undocumented overload. Migration guidance will show the equivalent options-object call. A compatibility adapter can be restored in a future release if consumer evidence requires it, but it will not remain part of this contract.

### 2. Keep extension navigation generic

`openExtensionPage` and `openExtensionSidePanel` will navigate to extension URLs and validate page readiness without requiring a message name or internal event protocol owned by a particular extension. The current `OPEN_SIDE_PANEL` request is extension-specific and will not be a prerequisite for the reusable helper.

Any extension-specific action that asks a background worker to open a side panel belongs in a consumer test or a separately documented adapter, not in the generic lifecycle API.

### 3. Support both delivery predicate forms

`waitForDelivery` will accept either a serializable string expression or a callback predicate evaluated in the target page. Both forms will use the same timeout and polling behavior and will return only after the predicate is truthy or fail with a timeout error.

The callback form will be constrained to functions that can be serialized and evaluated by Playwright. Tests will exercise the browser-visible result rather than importing extension internals.

### 4. Configure fixtures through the public launch options

The Playwright fixture will expose the extension path as a configurable option and will derive the remaining launch configuration from documented defaults or consumer-provided fixture configuration. Fixture teardown will close pages and the persistent context even when the test body fails.

### 5. Validate behavior at the library boundary

New validation will call the compiled/public library entry point from Playwright-facing tests and use the existing local unpacked extension cores. Coverage will prioritize lifecycle discovery, extension page opening, assertions, console diagnostics, content-to-background messaging, and service-worker restart behavior.

No test will import source files from an extension under test or inspect its private state as a substitute for browser behavior.

## Risks / Trade-offs

- [Breaking launcher signature] Existing consumers using the path-first form will need to migrate. -> Document the before/after call and treat the change as a deliberate major-version boundary.
- [Generic side-panel readiness is less opinionated] Removing the fixed runtime message may reduce automatic validation of one sample extension's behavior. -> Keep extension-specific open-side-panel flows in dedicated consumer tests while making generic navigation reusable.
- [Callback serialization limitations] Not every closure can run in the browser context. -> Document the callback as a serializable page predicate and retain the string-expression form.
- [Persistent profile collisions] Reusing a default profile can make tests interfere with one another. -> Keep custom `userDataDir` support and ensure tests use isolated temporary profiles where parallelism is enabled.
- [Generated output drift] `dist/` can become stale relative to `src/`. -> Include a build and declaration check after source changes and validate the public entry point from generated output.

## Migration Plan

1. Implement and validate the options-object API and update all repository consumers.
2. Update documentation with the new invocation form and removed extension-specific assumptions.
3. Generate and validate `dist/` declarations and runtime output.
4. For rollback, restore the previous path-first adapter or revert the major-version change as a coordinated release; do not silently support two conflicting contracts in the same documented API.
