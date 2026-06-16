const { spawn } = require('child_process');
const path = require('path');

const tests = [
  {
    name: 'Stateless Sidebar Toggle Resilience',
    file: 'playwright-sidebar-toggle-resilience.spec.js',
  },
];

function runTest(testFile) {
  return new Promise((resolve) => {
    const fullPath = path.resolve(__dirname, testFile);
    const child = spawn('node', [fullPath], {
      stdio: 'inherit',
      shell: false,
    });

    child.on('close', (code) => {
      resolve(code === 0);
    });
  });
}

(async () => {
  console.log('Running stateless_sidebar test suite...\n');

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    console.log('==================================================');
    console.log(`Running: ${test.name}`);
    console.log('==================================================');

    const success = await runTest(test.file);

    if (success) {
      passed += 1;
      console.log(`✅ PASS: ${test.name}\n`);
    } else {
      failed += 1;
      console.log(`❌ FAIL: ${test.name}\n`);
    }
  }

  console.log('==================================================');
  console.log('TEST SUITE SUMMARY');
  console.log('==================================================');
  console.log(`Total: ${tests.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    process.exit(1);
  }
})();
