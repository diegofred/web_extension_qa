const path = require('path');
const {
  launchExtensionContext,
  openUrl,
  assertSelectorVisible,
  assertSelectorExists,
  assertTextContains,
  assertTextEquals,
  assertUrlContains,
  assertElementCount,
  assertNoConsoleErrors,
  clickText,
  assertConsoleContains,
  createConsoleLogger,
  openExtensionPage,
  closeContext,
} = require('../playwright-extension-helpers');

(async () => {
  const extensionPath = process.argv[2] || path.resolve(__dirname, '../../extension_cores/stateless_messages');
  const { context, page, extensionId } = await launchExtensionContext(extensionPath, { headless: false });

  console.log('Extension loaded from:', extensionPath);
  console.log('Discovered extension id:', extensionId);

  if (!extensionId) {
    throw new Error('Extensions must load successfully and expose a chrome-extension:// target');
  }

  const testPage = await context.newPage();
  const pageLogs = await createConsoleLogger(testPage);

  await openUrl(testPage, 'https://example.com');
  await assertUrlContains(testPage, 'example.com');
  await assertSelectorVisible(testPage, 'text=Send To Panel');
  console.log('Content-script injection assertion passed.');

  await clickText(testPage, 'Send To Panel');
  console.log('Clicked injected content-script button.');

  // Some extensions emit console logs when a message is registered. If yours does, this is a useful validation.
  try {
    assertConsoleContains(pageLogs, '[CONTENT] registered session');
    console.log('Detected expected console entry from content script.');
  } catch (err) {
    console.warn('Optional console assertion skipped: ', err.message);
  }

  const sidePanelPage = await openExtensionPage(context, extensionId, 'sidepanel.html');
  console.log('Opened sidepanel extension page.');

  await assertUrlContains(sidePanelPage, `chrome-extension://${extensionId}/sidepanel.html`);
  await assertSelectorVisible(sidePanelPage, '#title');
  await assertSelectorVisible(sidePanelPage, '#refresh');
  await assertSelectorVisible(sidePanelPage, '#send');
  await assertSelectorExists(sidePanelPage, '#messages');
  console.log('Sidepanel UI elements exist.');

  const titleText = await sidePanelPage.textContent('#title');
  if (titleText) {
    const normalized = titleText.trim();
    if (normalized === 'Loading...') {
      throw new Error('Sidepanel did not complete initialization');
    }
    console.log('Sidepanel title:', normalized);
  }

  await clickText(sidePanelPage, 'Refresh');
  console.log('Clicked Refresh button in sidepanel.');

  await assertTextEquals(sidePanelPage, '#send', 'Send To Content');
  await clickText(sidePanelPage, 'Send To Content');
  console.log('Clicked Send To Content button in sidepanel.');

  const logEntries = await createConsoleLogger(sidePanelPage);
  await assertNoConsoleErrors(logEntries);
  console.log('No console errors detected in sidepanel.');

  const messagesText = await sidePanelPage.textContent('#messages');
  const messageCount = (await sidePanelPage.$$('#messages .msg')).length;
  console.log('Sidepanel messages container text length:', messagesText?.length || 0);
  console.log('Sidepanel message card count:', messageCount);

  console.log('Generic extension assertions completed successfully.');
  await closeContext(context);
})();
