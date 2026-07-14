const path = require('path');
const {
  launchExtensionContext,
  openUrl,
  assertSelectorVisible,
  assertTextContains,
  assertUrlContains,
  clickSelector,
  createConsoleLogger,
  assertNoConsoleErrors,
  openExtensionPage,
  closeContext,
} = require('../playwright-extension-helpers');

(async () => {
  const extensionPath = process.argv[2] || path.resolve(__dirname, '../../extension_cores/launcher_sidepanel_demo');

  const { context, extensionId } = await launchExtensionContext(extensionPath, { headless: false });

  if (!extensionId) {
    throw new Error('Extension id could not be discovered.');
  }

  // Arrange: open a regular page and verify launcher is injected.
  const page = await context.newPage();
  const pageLogs = await createConsoleLogger(page);

  await openUrl(page, 'https://example.com');
  await assertUrlContains(page, 'example.com');
  await assertSelectorVisible(page, '[data-testid="launcher-toggle"]');
  await assertTextContains(page, '[data-testid="launcher-toggle"]', 'Open Launcher');

  // Act: click launcher to open panel state.
  await clickSelector(page, '[data-testid="launcher-toggle"]');

  // Assert: launcher reflects open state.
  await assertTextContains(page, '[data-testid="launcher-toggle"]', 'Close Launcher');

  // Act: click launcher again to close panel state.
  await clickSelector(page, '[data-testid="launcher-toggle"]');

  // Assert: launcher reflects closed state.
  await assertTextContains(page, '[data-testid="launcher-toggle"]', 'Open Launcher');

  // Arrange/Assert: sidepanel page exists and close control is available.
  const sidePanelPage = await openExtensionPage(context, extensionId, 'sidepanel.html');
  const sidePanelLogs = await createConsoleLogger(sidePanelPage);

  await assertSelectorVisible(sidePanelPage, '#title');
  await assertSelectorVisible(sidePanelPage, '[data-testid="close-panel"]');

  // Act: close from sidepanel page.
  await clickSelector(sidePanelPage, '[data-testid="close-panel"]');

  // Assert: human-facing status message changes.
  await assertTextContains(sidePanelPage, '#status', 'Panel');

  await assertNoConsoleErrors(pageLogs);
  await assertNoConsoleErrors(sidePanelLogs);

  await closeContext(context);
})();
