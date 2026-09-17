const assert = require('assert');
const http = require('http');
const os = require('os');
const path = require('path');
const fs = require('fs');
const {
  launchExtensionContext,
  openExtensionPage,
  openExtensionSidePanel,
  sendMessageFromContent,
  waitForDelivery,
  assertSelectorVisible,
  assertSelectorExists,
  assertUrlContains,
  assertNoConsoleErrors,
  assertConsoleContains,
  createConsoleLogger,
  closeServiceWorker,
  closeContext,
} = require('../../dist');

function startFixtureServer() {
  const server = http.createServer((request, response) => {
    if (request.url === '/') {
      response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      response.end('<!doctype html><html><body><h1 data-testid="fixture-title">Library Fixture</h1></body></html>');
      return;
    }

    if (request.url === '/favicon.ico') {
      response.writeHead(204);
      response.end();
      return;
    }

    response.writeHead(404);
    response.end('Not found');
  });

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      resolve({ server, url: `http://127.0.0.1:${address.port}/` });
    });
  });
}

async function stopFixtureServer(server) {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

(async () => {
  const extensionPath = path.resolve(__dirname, '../../extension_cores/stateless_messages');
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'playwright-extension-library-'));
  const { server, url } = await startFixtureServer();
  let context;

  try {
    await assert.rejects(
      () => launchExtensionContext({ extensionPath: path.join(extensionPath, 'missing') }),
      /Extension path not found:/
    );

    const session = await launchExtensionContext({
      extensionPath,
      userDataDir,
      headless: false,
      viewport: { width: 1024, height: 700 },
    });
    ({ context } = session);

    assert.strictEqual(session.extensionPath, extensionPath);
    assert.strictEqual(session.page.viewportSize().width, 1024);
    assert.match(session.extensionId, /^[a-z]{32}$/);

    const pageLogs = createConsoleLogger(session.page);
    await session.page.goto(url, { waitUntil: 'domcontentloaded' });
    await assertSelectorVisible(session.page, '[data-testid="fixture-title"]');
    await session.page.evaluate(() => console.log('library diagnostic marker'));
    assertConsoleContains(pageLogs, 'library diagnostic marker');

    await session.page.evaluate(() => {
      setTimeout(() => {
        window.__deliveryReady = true;
      }, 100);
    });
    assert.strictEqual(
      await waitForDelivery(session.page, () => window.__deliveryReady === true, { timeout: 2000 }),
      true
    );

    const response = await sendMessageFromContent(session.page, 'CONTENT_TO_PANEL', {
      message: 'library contract test',
      url,
    });
    assert.strictEqual(response.success, true);

    const extensionPage = await openExtensionPage(context, session.extensionId, 'sidepanel.html');
    await assertUrlContains(extensionPage, `chrome-extension://${session.extensionId}/sidepanel.html`);
    await assertSelectorVisible(extensionPage, '#title');

    const sidepanelPage = await openExtensionSidePanel(context, session.extensionId);
    await assertUrlContains(sidepanelPage, `chrome-extension://${session.extensionId}/sidepanel.html`);
    await assertSelectorExists(sidepanelPage, '#messages');

    await closeServiceWorker(context, session.extensionId, { delayAfterClose: 200 });
    const restartedSidepanel = await openExtensionPage(context, session.extensionId, 'sidepanel.html');
    await assertSelectorVisible(restartedSidepanel, '#title');
    await restartedSidepanel.click('#refresh');
    await assertSelectorExists(restartedSidepanel, '#messages');
    const errorPage = await context.newPage();
    const errorLogs = createConsoleLogger(errorPage);
    await errorPage.goto('data:text/html,<title>Diagnostic</title>', { waitUntil: 'load' });
    await errorPage.evaluate(() => setTimeout(() => { throw new Error('diagnostic page error'); }, 0));
    await errorPage.waitForTimeout(100);
    assert(errorLogs.some((entry) => entry.type === 'error'));
    await errorPage.close();

    assertNoConsoleErrors(pageLogs);

    await extensionPage.close();
    await sidepanelPage.close();
    await restartedSidepanel.close();
    console.log('PASS: public library API contract validated');
  } finally {
    if (context) await closeContext(context);
    await stopFixtureServer(server);
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }
})();
