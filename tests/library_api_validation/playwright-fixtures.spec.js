const fs = require('fs');
const os = require('os');
const path = require('path');
const { test, expect } = require('../../dist/fixtures');

const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'playwright-extension-fixture-'));

test.use({
  extensionPath: path.resolve(__dirname, '../../extension_cores/stateless_messages'),
  extensionLaunchOptions: {
    headless: false,
    viewport: { width: 900, height: 650 },
    userDataDir,
  },
});

test.afterAll(() => {
  fs.rmSync(userDataDir, { recursive: true, force: true });
});

test('library fixtures expose configured extension context and side panel', async ({
  extensionContext,
  extensionId,
  sidepanelPage,
}) => {
  expect(extensionId).toMatch(/^[a-z]{32}$/);
  expect(extensionContext.pages().length).toBeGreaterThan(0);
  await expect(sidepanelPage.locator('#title')).toBeVisible();
  await expect(sidepanelPage).toHaveURL(`chrome-extension://${extensionId}/sidepanel.html`);
});
