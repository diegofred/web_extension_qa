## 1. Package Metadata and Dependency Contract

- [x] 1.1 Add a package metadata assertion or fixture for the root runtime/type entries, supported Node.js range, and Playwright peer dependency; verify the assertion fails when any required field is missing.
- [x] 1.2 Add explicit root `exports` entries for CommonJS runtime and TypeScript declarations while preserving `main`, `types`, the package name, and existing helper signatures; verify with `npm run build` and a direct package-root import.
- [x] 1.3 Move the consumer-facing Playwright compatibility declaration into `peerDependencies` while retaining the repository development dependency; verify package metadata and lockfile consistency without changing the tested Playwright version range.

## 2. Packed Artifact and Consumer Smoke Test

- [x] 2.1 Define the npm package file allowlist so the tarball contains compiled `dist/` output, package metadata, and required consumer documentation while excluding source, tests, extension cores, OpenSpec artifacts, and test results; verify with `npm pack --dry-run`.
- [x] 2.2 Add a local package smoke-test runner that builds and packs the library, creates an isolated temporary consumer, installs the local tarball with its compatible Playwright dependency, and imports the package root; verify it runs without network or production API access.
- [x] 2.3 Extend the smoke test to validate TypeScript declaration resolution and fail with an actionable message when runtime exports, declarations, or dependency metadata are missing; verify both success and a controlled broken-package assertion.
- [x] 2.4 Ensure smoke-test cleanup removes only its own temporary consumer and tarball artifacts; verify the repository remains free of generated package test directories after the command completes.

## 3. Consumer Documentation

- [x] 3.1 Add an installed-package setup section to `README_PLAYWRIGHT.md` covering npm installation, Node.js and Playwright prerequisites, package-root imports, and consumer-owned unpacked extension paths; verify links and commands reference existing files or scripts.
- [x] 3.2 Clearly distinguish the published TypeScript API from repository-local JavaScript helper scripts and preserve the existing helper reference required by project context; verify the README contains both workflows without contradictory signatures.
- [x] 3.3 Document the package boundary and compatibility policy without renaming the package or implying that this change publishes to npm; verify the package name and public API remain unchanged.

## 4. Integration Validation

- [x] 4.1 Run the focused package smoke test, TypeScript build, and existing public-library validation tests; verify runtime behavior and extension-context compatibility remain unchanged.
- [x] 4.2 Run `npm test`, inspect the packed file list, and run strict OpenSpec validation; verify package preparation introduces no regression in the existing browser suite or specification contract.
