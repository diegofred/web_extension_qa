const path = require('path');
const {
  launchExtensionContext,
  openUrl,
  assertSelectorVisible,
  clickText,
  openExtensionPage,
  closeContext,
  delay,
} = require('../playwright-extension-helpers');

async function getDebugState(extensionPage) {
  return await extensionPage.evaluate(async () => {
    if (chrome.runtime.sendMessage.length === 1) {
      return await chrome.runtime.sendMessage({ type: 'DEBUG_GET_ALL_STATES' });
    }

    return await new Promise(resolve => {
      chrome.runtime.sendMessage({ type: 'DEBUG_GET_ALL_STATES' }, resolve);
    });
  });
}

(async () => {
  const extensionPath = path.resolve(__dirname, '../../extension_cores/sidepanel_lib_validation');
  const { context, extensionId } = await launchExtensionContext({ extensionPath, headless: false });

  if (!extensionId) {
    throw new Error('Could not discover extension id.');
  }

  console.log('[Arrange] Opening Tab A and Tab B');
  const tabA = await context.newPage();
  await openUrl(tabA, 'https://example.com');
  await assertSelectorVisible(tabA, '#rb-open-sidepanel');

  const tabB = await context.newPage();
  await openUrl(tabB, 'https://example.org');
  await assertSelectorVisible(tabB, '#rb-open-sidepanel');

  console.log('[Act] Open sidepanel on Tab A');
  await tabA.bringToFront();
  await clickText(tabA, 'Open Sidepanel (This Tab)');
  await delay(300);

  console.log('[Assert] Tab A is open in debug map');
  const extensionPage = await openExtensionPage(context, extensionId, 'sidepanel.html');
  let debugState = await getDebugState(extensionPage);
  const tabAId = tabA.url() && (await tabA.evaluate(() => chrome?.tabs ? null : null));

  // Fetch tab ids from runtime context instead of relying on page internals.
  const tabInfo = await extensionPage.evaluate(async () => {
    const tabs = await chrome.tabs.query({});
    const mapped = tabs.map(tab => ({ id: tab.id, url: tab.url || '' }));
    return mapped;
  });

  const a = tabInfo.find(tab => tab.url.includes('example.com'));
  const b = tabInfo.find(tab => tab.url.includes('example.org'));

  if (!a || !b) {
    throw new Error(`Could not find both test tabs. Got: ${JSON.stringify(tabInfo)}`);
  }

  if (!debugState?.tabStateMap?.[String(a.id)]) {
    throw new Error(`Expected Tab A (${a.id}) to be open. State: ${JSON.stringify(debugState)}`);
  }

  console.log('[Act] Switch to Tab B and wait for onActivated sync');
  await tabB.bringToFront();
  await delay(400);
  debugState = await getDebugState(extensionPage);

  if (debugState?.activationSyncMap?.[String(b.id)] !== false) {
    throw new Error(`Expected Tab B (${b.id}) activation sync to disable panel. State: ${JSON.stringify(debugState)}`);
  }

  console.log('[Act] Switch back to Tab A and wait for onActivated sync');
  await tabA.bringToFront();
  await delay(400);
  debugState = await getDebugState(extensionPage);

  if (debugState?.activationSyncMap?.[String(a.id)] !== true) {
    throw new Error(`Expected Tab A (${a.id}) activation sync to enable panel. State: ${JSON.stringify(debugState)}`);
  }

  console.log('PASS: strict per-tab sidepanel behavior validated');
  await closeContext(context);
})();
