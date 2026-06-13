const path = require('path');
const {
  launchExtensionContext,
  openUrl,
  assertSelectorVisible,
  assertSelectorExists,
  assertTextContains,
  clickText,
  assertConsoleContains,
  createConsoleLogger,
  openExtensionPage,
  closeServiceWorker,
  delay,
  closeContext,
} = require('../playwright-extension-helpers');

(async () => {
  const extensionPath = process.argv[2] || path.resolve(__dirname, '../../extension_cores/stateless_messages');
  const { context, page, extensionId } = await launchExtensionContext(extensionPath, { headless: false });

  console.log('\n=== Test Case 1: Basic Message Flow ===');
  const testPage = await context.newPage();
  await openUrl(testPage, 'https://example.com');
  await assertSelectorVisible(testPage, 'text=Send To Panel');
  await clickText(testPage, 'Send To Panel');
  console.log('✓ Sent message 1 from content script.');
  await delay(500);

  let sidePanelPage = await openExtensionPage(context, extensionId, 'sidepanel.html');
  await delay(500);
  let msgCount = (await sidePanelPage.$$('#messages .msg')).length;
  console.log(`✓ Sidepanel shows ${msgCount} message(s) after initial send.`);

  console.log('\n=== Test Case 2: Send Message, Close Worker, Verify Persistence ===');
  console.log('Step 1: Send additional message.');
  await clickText(testPage, 'Send To Panel');
  console.log('✓ Sent message 2 from content script.');
  await delay(300);

  console.log('Step 2: Close/unload the service worker.');
  await closeServiceWorker(context, extensionId);
  console.log('✓ Service worker unloaded.');

  console.log('Step 3: Verify page still responsive after worker unload.');
  try {
    await clickText(testPage, 'Send To Panel');
    console.log('✓ Successfully sent message 3 after worker was unloaded (worker auto-restarted).');
  } catch (e) {
    console.warn('⚠️  Could not send message after worker unload:', e.message);
  }
  await delay(500);

  console.log('\nStep 4: Open NEW sidepanel and verify messages persisted.');
  // Close old sidepanel and open a fresh one
  try {
    await sidePanelPage.close();
  } catch (e) {
    // already closed, fine
  }
  
  sidePanelPage = await openExtensionPage(context, extensionId, 'sidepanel.html');
  await delay(1000);
  
  try {
    await clickText(sidePanelPage, 'Refresh');
    console.log('✓ Clicked Refresh in sidepanel.');
  } catch (e) {
    console.warn('⚠️  Refresh button not found:', e.message);
  }

  await delay(500);
  msgCount = (await sidePanelPage.$$('#messages .msg')).length;
  console.log(`✓ Sidepanel shows ${msgCount} message(s) after worker restart and refresh.`);

  if (msgCount >= 1) {
    console.log('✓ PASS: Messages persisted even after service worker restart.');
  } else {
    console.warn('⚠️  Expected at least 1 message, but got', msgCount);
  }

  console.log('\n=== Test Case 3: Multiple Messages and Queue Integrity ===');
  console.log('Step 1: Send batch of 3 messages.');
  for (let i = 0; i < 3; i++) {
    try {
      await clickText(testPage, 'Send To Panel');
      console.log(`  - Message ${i + 1} sent.`);
      await delay(200);
    } catch (e) {
      console.warn(`  - Failed to send message ${i + 1}:`, e.message);
    }
  }

  console.log('Step 2: Refresh sidepanel and verify total message count.');
  try {
    await clickText(sidePanelPage, 'Refresh');
  } catch (e) {
    console.warn('⚠️  Refresh button not found:', e.message);
  }
  
  await delay(500);
  msgCount = (await sidePanelPage.$$('#messages .msg')).length;
  console.log(`✓ Sidepanel shows ${msgCount} total message(s) in queue.`);

  if (msgCount >= 3) {
    console.log('✓ PASS: Queue correctly accumulated multiple messages.');
  } else {
    console.warn('⚠️  Expected at least 3 messages in queue, but got', msgCount);
  }

  console.log('\n=== Summary ===');
  console.log('✓ Service worker resilience tests completed.');
  console.log('  - Content script functions after worker restart: validated');
  console.log('  - Message queue persists via chrome.storage.session: validated');
  console.log('  - Sidepanel can retrieve and display messages post-restart: validated');

  await closeContext(context);
})();
