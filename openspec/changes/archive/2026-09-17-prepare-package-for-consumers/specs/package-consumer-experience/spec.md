## Purpose

Defines the installable package boundary that lets external Playwright test repositories consume the extension-testing library with predictable runtime imports, TypeScript declarations, dependency expectations, and documented setup.

## ADDED Requirements

### Requirement: The package exposes a stable root entry point

The package SHALL expose its compiled library and TypeScript declarations through the package root, and SHALL preserve the existing package name and public helper signatures while adding explicit metadata for supported runtime and module resolution.

#### Scenario: Consumer imports the package root
- **WHEN** a consumer installs the package and imports the package root
- **THEN** the runtime resolves to the compiled library entry point and exposes the documented helpers

#### Scenario: TypeScript resolves package declarations
- **WHEN** a consumer type-checks an import from the package root
- **THEN** TypeScript resolves declarations for the public exports without importing repository source files

#### Scenario: Consumer uses a supported runtime
- **WHEN** a consumer uses a Node.js version and Playwright version within the documented compatibility range
- **THEN** the package metadata identifies the environment as supported and installation does not require undocumented runtime assumptions

### Requirement: The packed artifact contains only consumer-facing files

The package SHALL include the compiled library output, package metadata, and required consumer documentation, and SHALL exclude repository-only source, fixtures, tests, OpenSpec artifacts, and generated test results.

#### Scenario: Consumer installs from a local tarball
- **WHEN** a consumer installs the tarball generated from the repository
- **THEN** the package contains the root runtime entry point and declarations needed to use the library

#### Scenario: Package contents are inspected
- **WHEN** the package file list is examined before publication
- **THEN** repository-only extension cores, test suites, source files, planning artifacts, and test result directories are absent

### Requirement: Runtime dependency expectations are explicit

The package SHALL declare Playwright as a consumer-facing peer dependency while retaining the development dependencies required to build and validate the repository.

#### Scenario: Consumer installs required peer dependencies
- **WHEN** a consumer installs the package with a compatible Playwright installation
- **THEN** the package can load its lifecycle, assertion, messaging, and fixture exports without missing runtime modules

#### Scenario: Consumer uses an incompatible Playwright version
- **WHEN** a consumer attempts installation outside the documented compatibility range
- **THEN** package metadata provides an actionable compatibility warning rather than silently claiming support

### Requirement: The package has a repeatable local consumer validation

The repository SHALL provide a deterministic smoke test that builds the package, packs it locally, installs it into an isolated consumer, imports the root package, and validates its runtime and declaration surfaces without production or third-party network access.

#### Scenario: Local tarball smoke test succeeds
- **WHEN** the package smoke test runs with the repository dependencies available
- **THEN** it produces a tarball, installs it in an isolated consumer, imports a documented helper, and completes successfully

#### Scenario: Package boundary is broken
- **WHEN** the packed artifact lacks a runtime entry, declaration, or required dependency metadata
- **THEN** the smoke test fails with an actionable error before the package is considered ready for publication

### Requirement: Documentation distinguishes repository and installed usage

The README SHALL document package installation, supported runtime assumptions, root-package imports, fixture usage, and the difference between published TypeScript APIs and repository-local JavaScript examples.

#### Scenario: New consumer follows package setup
- **WHEN** a consumer follows the package setup instructions from a clean test repository
- **THEN** the instructions identify the package install, Playwright prerequisite, import path, and unpacked extension path needed to start a test

#### Scenario: Repository contributor follows local setup
- **WHEN** a contributor runs the repository examples
- **THEN** the documentation still provides the local build and test commands without implying that repository-only helper scripts are the published package API
