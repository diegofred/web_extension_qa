const path = require('path');
const {
  launchExtensionContext,
  openUrl,
  assertSelectorVisible,
  clickText,
  openExtensionPage,
  delay,
  closeContext,
} = require('../playwright-extension-helpers');

(async () => {
  const extensionPath = process.argv[2] || path.resolve(__dirname, '../../extension_cores/stateless_messages');
  const { context, page, extensionId } = await launchExtensionContext({ extensionPath, headless: false });

  console.log('\n=== Diagnostic Test: Message Flow and Storage ===');

  const testPage = await context.newPage();
  await openUrl(testPage, 'https://example.com');
  
  // Inject logging into the content script to see what's happening
  const logMessages = await testPage.evaluate(() => {
    return new Promise((resolve) => {
      const logs = [];
      const originalLog = console.log;
      console.log = function(...args) {
        logs.push(args.join(' '));
        originalLog.apply(console, args);
      };
      setTimeout(() => resolve(logs), 1000);
    });
  });

  console.log('Content script console logs:', logMessages);

  await assertSelectorVisible(testPage, 'text=Send To Panel');
  
  console.log('\n--- Test 1: Send Message and Inspect Storage ---');
  await clickText(testPage, 'Send To Panel');
  await delay(500);

  const tabInspector = await openExtensionPage(context, extensionId, 'sidepanel.html');
  const targetTab = await tabInspector.evaluate(async () => {
    const tabs = await chrome.tabs.query({});
    return tabs.find((tab) => tab.url === 'https://example.com/' || tab.url === 'https://example.com');
  });
  await tabInspector.close();

  if (!targetTab?.id) {
    throw new Error('Could not identify the content tab for diagnostic queue inspection');
  }

  const sidePanelPage = await openExtensionPage(context, extensionId, `sidepanel.html?tabId=${targetTab.id}`);
  await delay(500);

  // From sidepanel, inspect the full storage.session state
  const storageSnapshot = await sidePanelPage.evaluate(async () => {
    return new Promise((resolve) => {
      chrome.storage.session.get(null, (data) => {
        resolve(data || {});
      });
    });
  });

  console.log('Full chrome.storage.session state:');
  console.log(JSON.stringify(storageSnapshot, null, 2));

  // Check if there's a queue key that matches a tab session
  const queueKeys = Object.keys(storageSnapshot).filter(k => k.startsWith('queue:'));
  console.log(`\nFound ${queueKeys.length} queue key(s):`, queueKeys);

  if (queueKeys.length > 0) {
    queueKeys.forEach(key => {
      console.log(`  ${key}:`, storageSnapshot[key]);
    });
  }

  const expectedQueueKey = `queue:tab:${targetTab.id}`;
  console.log('\nContent tab used for diagnostic:', { tabId: targetTab.id, url: targetTab.url });
  console.log(`Expected queue key: ${expectedQueueKey}`);
  console.log(`Queue data for this key:`, storageSnapshot[expectedQueueKey] || 'NOT FOUND');

  if (!storageSnapshot[expectedQueueKey]) {
    throw new Error(`Expected queue data for ${expectedQueueKey}`);
  }

  console.log('\n--- Test 2: Check Sidepanel Message Container ---');
  const msgCardCount = (await sidePanelPage.$$('#messages .msg')).length;
  const msgContainerText = await sidePanelPage.textContent('#messages');
  console.log(`Message container HTML length: ${msgContainerText?.length || 0}`);
  console.log(`Message cards found: ${msgCardCount}`);

  if (queueKeys.length === 0) {
    throw new Error('Expected at least one queue key in storage.session');
  }
  if (msgCardCount < 1) {
    throw new Error(`Expected the sidepanel to display at least one message, but got ${msgCardCount}`);
  }

  console.log('\n--- Summary ---');
  console.log('✓ Queue keys found and displayed for the originating content tab.');

  await closeContext(context);
})();
