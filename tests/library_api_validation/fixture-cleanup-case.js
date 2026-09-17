const path = require('path');
const { test } = require('../../dist/fixtures');

test.use({
  extensionPath: path.resolve(__dirname, '../../extension_cores/stateless_messages'),
  extensionLaunchOptions: { headless: false },
});

test('fixture cleanup failure probe', async ({ sidepanelPage }) => {
  await sidepanelPage.locator('#title').waitFor({ state: 'visible' });
  throw new Error('intentional fixture failure probe');
});
