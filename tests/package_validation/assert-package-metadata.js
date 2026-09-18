const assert = require('assert');
const fs = require('fs');
const path = require('path');

function readPackage(packageRoot) {
  const packagePath = path.join(packageRoot, 'package.json');
  return JSON.parse(fs.readFileSync(packagePath, 'utf8'));
}

function assertPackageMetadata(packageJson) {
  assert.strictEqual(packageJson.main, 'dist/index.js', 'main must point to the compiled runtime entry');
  assert.strictEqual(packageJson.types, 'dist/index.d.ts', 'types must point to the compiled declaration entry');
  assert.ok(packageJson.exports && packageJson.exports['.'], 'root exports entry is missing');
  assert.strictEqual(packageJson.exports['.'].types, './dist/index.d.ts', 'root types export is missing');
  assert.strictEqual(packageJson.exports['.'].require, './dist/index.js', 'root require export is missing');
  assert.strictEqual(packageJson.exports['.'].default, './dist/index.js', 'root default export is missing');
  assert.strictEqual(packageJson.engines?.node, '>=20', 'supported Node.js range must be explicit');
  assert.strictEqual(packageJson.peerDependencies?.['@playwright/test'], '^1.63.0', 'Playwright peer range changed unexpectedly');
  assert.strictEqual(packageJson.devDependencies?.['@playwright/test'], '^1.63.0', 'Playwright development dependency is required');
  assert.deepStrictEqual(packageJson.files, ['dist', 'README_PLAYWRIGHT.md'], 'package file allowlist changed unexpectedly');
}

if (require.main === module) {
  const packageJson = readPackage(path.resolve(__dirname, '../..'));
  assertPackageMetadata(packageJson);
  console.log('PASS: package metadata contract verified');
}

module.exports = { assertPackageMetadata, readPackage };
