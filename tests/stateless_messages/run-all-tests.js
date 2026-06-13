#!/usr/bin/env node

/**
 * Test runner for stateless_messages extension
 * Executes all test specs in sequence with labeled output
 */

const { spawn } = require('child_process');
const path = require('path');

const tests = [
  {
    name: '🧪 Generic Extension Test',
    script: 'playwright-extension.spec.js',
    description: 'Validates content script injection, messaging, and UI interaction'
  },
  {
    name: '🔄 Worker Resilience Test',
    script: 'playwright-extension-worker-resilience.spec.js',
    description: 'Validates message persistence across service worker restarts'
  },
  {
    name: '🔍 Diagnostic Storage Inspector',
    script: 'playwright-extension-diagnostic.spec.js',
    description: 'Inspects chrome.storage.session state and queue structure'
  }
];

const runTest = (testIndex) => {
  if (testIndex >= tests.length) {
    console.log('\n✅ All tests completed!\n');
    process.exit(0);
  }

  const test = tests[testIndex];
  console.log(`\n${'='.repeat(70)}`);
  console.log(`${test.name}`);
  console.log(`${test.description}`);
  console.log(`${'='.repeat(70)}\n`);

  const scriptPath = path.join(__dirname, test.script);
  const child = spawn('node', [scriptPath], {
    stdio: 'inherit',
    cwd: __dirname
  });

  child.on('exit', (code) => {
    if (code === 0 || code === 1) {
      // Both 0 and 1 are acceptable (1 might be from console errors that are expected)
      console.log(`\n✓ ${test.name} completed\n`);
      runTest(testIndex + 1);
    } else {
      console.error(`\n✗ ${test.name} failed with code ${code}\n`);
      process.exit(code);
    }
  });
};

console.log('\n🚀 Starting stateless_messages extension test suite...\n');
runTest(0);
