#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

const tests = [
  {
    name: 'Launcher SidePanel Toggle Test',
    script: 'playwright-launcher-sidepanel.spec.js',
  },
];

function runTest(index) {
  if (index >= tests.length) {
    console.log('All launcher_sidepanel_demo tests completed successfully.');
    process.exit(0);
  }

  const test = tests[index];
  const scriptPath = path.join(__dirname, test.script);

  console.log(`Running: ${test.name}`);

  const child = spawn('node', [scriptPath], {
    stdio: 'inherit',
    cwd: __dirname,
  });

  child.on('exit', code => {
    if (code === 0) {
      runTest(index + 1);
      return;
    }

    console.error(`${test.name} failed with code ${code}`);
    process.exit(code);
  });
}

runTest(0);
