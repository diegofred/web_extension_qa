const assert = require('assert');
const { spawnSync } = require('child_process');

const result = spawnSync(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['playwright', 'test', 'tests/library_api_validation/fixture-cleanup-case.spec.js', '--workers=1', '--reporter=line'],
  { encoding: 'utf8', env: { ...process.env, RUN_FIXTURE_CLEANUP_PROBE: '1' } }
);

const output = `${result.stdout}\n${result.stderr}`;
assert.notStrictEqual(result.status, 0, 'The cleanup probe must fail inside the test body');
assert.match(output, /intentional fixture failure probe/);
assert.doesNotMatch(output, /Timeout.*exceeded|Test timeout of/);
console.log('PASS: fixture teardown completed after an intentional test failure');
