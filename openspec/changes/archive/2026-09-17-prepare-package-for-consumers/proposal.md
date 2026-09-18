## Why

The core extension-testing API now works through the compiled `dist/` entry point, but the package metadata and consumer workflow are not yet robust enough for an external test suite to install and import it reliably. Making the package boundary explicit is the next recommended step before publishing or asking another repository to consume the library.

## What Changes

- Define the package's supported Node.js and Playwright compatibility requirements.
- Expose the root package through explicit CommonJS and TypeScript `exports` entries while preserving the current `main` and `types` fields.
- Declare Playwright as a consumer-facing peer dependency while retaining the development dependency needed to build and validate this repository.
- Limit the packed artifact to the compiled library output and required consumer documentation.
- Add a repeatable package smoke test that builds, packs, installs, and imports the library from a clean temporary consumer.
- Update the README with package-installation usage, supported runtime assumptions, and the distinction between the published TypeScript API and repository-local JavaScript examples.
- Avoid renaming the package or publishing it as part of this change.

## Capabilities

### New Capabilities

- `package-consumer-experience`: Enables external Playwright test repositories to install, import, type-check, and execute the extension-testing library from its published package boundary.

### Modified Capabilities

None.

## Impact

- Affected package metadata: `package.json` and potentially the lockfile if dependency metadata changes require it.
- Affected build/package validation: `dist/`, npm pack output, and a temporary consumer project.
- Affected documentation: `README_PLAYWRIGHT.md`.
- No extension runtime behavior or helper signatures should change.
- No production or third-party network calls are required; package validation must use the local tarball and local repository dependencies.
