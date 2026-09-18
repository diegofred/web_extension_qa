const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { assertPackageMetadata } = require('./assert-package-metadata');

const repositoryRoot = path.resolve(__dirname, '../..');
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'web-extension-qa-package-'));
const consumerRoot = path.join(tempRoot, 'consumer');
const packRoot = path.join(tempRoot, 'pack');

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd || repositoryRoot,
    encoding: 'utf8',
    env: { ...process.env, ...(options.env || {}) },
  });

  if (result.status !== 0) {
    throw new Error([
      `${command} ${args.join(' ')} failed with exit code ${result.status}`,
      result.stdout,
      result.stderr,
    ].filter(Boolean).join('\n'));
  }

  return result.stdout;
}

function writeConsumerFiles() {
  fs.mkdirSync(consumerRoot, { recursive: true });
  fs.writeFileSync(
    path.join(consumerRoot, 'package.json'),
    JSON.stringify({ name: 'local-extension-test-consumer', version: '1.0.0', private: true }, null, 2)
  );
  fs.writeFileSync(
    path.join(consumerRoot, 'index.ts'),
    "import { assertNoConsoleErrors, launchExtensionContext } from 'web-extension-qa';\n\nvoid assertNoConsoleErrors;\nvoid launchExtensionContext;\n"
  );
}

function packPackage() {
  fs.mkdirSync(packRoot, { recursive: true });
  const output = run('npm', ['pack', '--json', '--pack-destination', packRoot]);
  const result = JSON.parse(output);
  assert.strictEqual(result.length, 1, 'npm pack must produce exactly one tarball');

  const files = result[0].files.map((entry) => entry.path);
  const requiredFiles = ['package.json', 'README_PLAYWRIGHT.md', 'dist/index.js', 'dist/index.d.ts'];
  for (const requiredFile of requiredFiles) {
    assert(files.includes(requiredFile), `Packed package is missing ${requiredFile}`);
  }

  for (const file of files) {
    assert(
      file === 'package.json' || file === 'README_PLAYWRIGHT.md' || file.startsWith('dist/'),
      `Repository-only file included in package: ${file}`
    );
  }

  return path.join(packRoot, result[0].filename);
}

function installConsumer(tarball) {
  writeConsumerFiles();
  run('npm', [
    'install',
    '--offline',
    '--no-audit',
    '--no-fund',
    '--ignore-scripts',
    '--save-exact',
    tarball,
    '@playwright/test@1.63.0',
    'typescript@7.0.2',
    '@types/node@26.6.1',
  ], { cwd: consumerRoot });
}

function validateConsumer() {
  const installedPackagePath = path.join(consumerRoot, 'node_modules', 'web-extension-qa', 'package.json');
  const installedPackage = JSON.parse(fs.readFileSync(installedPackagePath, 'utf8'));
  assertPackageMetadata(installedPackage);

  const brokenPackage = { ...installedPackage };
  delete brokenPackage.exports;
  assert.throws(() => assertPackageMetadata(brokenPackage), /root exports entry is missing/);

  run('node', ['-e', "const api = require('web-extension-qa'); if (typeof api.launchExtensionContext !== 'function') process.exit(1);"], { cwd: consumerRoot });
  run(path.join(consumerRoot, 'node_modules', '.bin', 'tsc'), [
    '--noEmit',
    '--strict',
    '--skipLibCheck',
    '--target',
    'ES2022',
    '--module',
    'NodeNext',
    '--moduleResolution',
    'NodeNext',
    'index.ts',
  ], { cwd: consumerRoot });
}

try {
  run('npm', ['run', 'build']);
  const tarball = packPackage();
  installConsumer(tarball);
  validateConsumer();
  console.log('PASS: local package consumer smoke test verified runtime and declarations');
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
