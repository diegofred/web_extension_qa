## Context

See `proposal.md` for the motivation. The repository already compiles the TypeScript library into `dist/` and exposes `main` and `types` in `package.json`, but the package boundary is implicit. Playwright is imported by the runtime library while being declared only as a development dependency, and there is no clean-consumer check for the tarball produced by npm.

## Goals / Non-Goals

**Goals:**

- Make the package metadata accurately describe the runtime and type entry points.
- Keep the existing package name and public helper signatures unchanged.
- Ensure a local npm tarball contains the files a consumer needs and excludes repository-only fixtures and tests.
- Verify installation and root imports from a clean local consumer without network access.
- Keep the README consistent with both repository development and installed-package usage.

**Non-Goals:**

- Publishing to npm or changing package ownership/scope.
- Renaming the package.
- Adding subpath exports for individual helpers.
- Changing Playwright launch behavior, extension messaging, or fixture semantics.
- Supporting package managers other than npm in the smoke test.

## Decisions

### 1. Use explicit root exports

Add a root `exports` map with `require` and `types` entries pointing to `dist/index.js` and `dist/index.d.ts`. Preserve `main` and `types` for tools that still read legacy metadata. A subpath export is unnecessary until a consumer need exists and would increase the supported surface.

### 2. Declare Playwright as a peer dependency

The published helpers execute against the consumer's Playwright installation, so `@playwright/test` belongs in `peerDependencies`. Keep it in `devDependencies` as well so this repository can build and run its validation suite. Use the existing tested major/minor compatibility range rather than introducing a second version policy.

### 3. Use an explicit package file allowlist

The package will include compiled `dist/` output, package metadata, and the consumer README. Source files, local extension cores, test scripts, OpenSpec artifacts, and generated test results remain repository-only. The allowlist makes package contents deterministic and prevents accidental fixture or internal-file publication.

### 4. Validate through a local tarball

The smoke test will run the build, create an npm tarball, create an isolated temporary consumer, install the tarball and its local development dependencies, and import the root package. It will verify both a runtime helper export and the TypeScript declaration surface without contacting production services or third-party APIs.

### 5. Document installed-package usage separately from repository examples

README examples for `./dist` remain useful while developing this repository, but installed consumers will use the package name. The documentation will state the Node.js and Playwright prerequisites and explain that extension paths still refer to the consumer's own unpacked build.

## Risks / Trade-offs

- [Peer dependency installation differences] npm versions and consumer package managers may resolve peers differently. -> Keep the local smoke test on npm and document the required Playwright peer explicitly.
- [Allowlist omissions] A future required artifact could be excluded from the tarball. -> Make the smoke test import the package from a packed tarball and inspect the packed file list.
- [CommonJS-only generated output] The current TypeScript configuration emits CommonJS-compatible output. -> Expose `require` and type entries only; defer an ESM export until the compiler/package module strategy changes deliberately.
- [README drift] Repository-relative and package-relative examples can diverge. -> Add separate headings and validate referenced package entry points in the smoke test.

## Migration Plan

1. Update package metadata and documentation without changing the package name or helper signatures.
2. Build and run the local tarball consumer smoke test.
3. Review the packed file list and generated declarations.
4. If a package consumer reveals a metadata incompatibility, revert the metadata-only commit; the compiled library and browser behavior remain independently usable from `dist/`.
