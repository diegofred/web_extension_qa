const { spawnSync } = require('child_process');
const path = require('path');

const testFile = path.resolve(__dirname, 'playwright-sidepanel-lib-validation.spec.js');

console.log('Running sidepanel lib validation test...');
const result = spawnSync('node', [testFile], { stdio: 'inherit' });

if (result.status !== 0) {
  process.exit(result.status || 1);
}

console.log('All sidepanel lib validation tests passed.');
