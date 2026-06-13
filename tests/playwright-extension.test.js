const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function findExtensionId(client) {
  const res = await client.send('Target.getTargets');
  const targets = res.targetInfos || [];
  const ext = targets.find(t => t.url && t.url.startsWith('chrome-extension://'));
  if (!ext) return null;
  const parts = ext.url.split('/');
  return parts[2];
}

(async () => {
  const extensionPath = path.resolve(__dirname, '../extension_cores/stateless_messages');
  if (!fs.existsSync(extensionPath)) {
    console.error('Extension path not found:', extensionPath);
    process.exit(1);
  }

  const userDataDir = path.join(__dirname, '.tmp_profile');
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--no-sandbox'
    ],
  });

  // Attach a CDP session to discover extension targets
  const page = await context.newPage();
  const client = await context.newCDPSession(page);
  let extensionId = null;
  try {
    extensionId = await findExtensionId(client);
  } catch (e) {
    console.warn('Error discovering extension id via CDP', e.message);
  }

  if (!extensionId) {
    console.warn('Could not locate extension id automatically. You can open chrome://extensions to see the id.');
  } else {
    console.log('Found extension id:', extensionId);
  }

  // Open a test website and interact with the injected content script
  const testPage = await context.newPage();
  testPage.on('console', msg => console.log('PAGE LOG:', msg.text()));
  testPage.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  await testPage.goto('https://example.com');
  try {
    await testPage.waitForSelector('text=Send Message To SidePanel', { timeout: 5000 });
    await testPage.click('text=Send Message To SidePanel');
    console.log('Clicked content script button');
  } catch (e) {
    console.warn('Content script button not found — ensure the extension is injected on the page');
  }

  // If we discovered the extension id, open the sidepanel directly
  if (extensionId) {
    const sideUrl = `chrome-extension://${extensionId}/sidepanel.html`;
    const side = await context.newPage();
    await side.goto(sideUrl);
    console.log('Opened sidepanel at', sideUrl);

    try {
      const text = await side.textContent('body');
      console.log('Sidepanel body text length:', text && text.length);
    } catch (e) {
      console.warn('Could not read sidepanel content');
    }

    try {
      await side.click('text=Send To Content', { timeout: 2000 });
      console.log('Clicked sidepanel button (if present)');
    } catch (e) {
      // optional action
    }
  }

  console.log('Playwright demo finished — browser kept open for manual inspection.');
})();
