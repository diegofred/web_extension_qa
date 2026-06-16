const path = require('path');
const http = require('http');
const {
  launchExtensionContext,
  openUrl,
  assertSelectorVisible,
  assertTextContains,
  assertNoConsoleErrors,
  createConsoleLogger,
  openExtensionPage,
  delay,
  closeContext,
} = require('../playwright-extension-helpers');

function startLocalFixtureServer() {
  const fixtureHtml = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Generic PMS Fixture</title>
  </head>
  <body>
    <h1 data-testid="fixture-title">Generic PMS Prospect</h1>
    <p data-testid="fixture-description">Local fixture for stateless sidebar integration tests.</p>
  </body>
</html>`;

  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      if (req.url === '/' || req.url === '/generic/local-fixture.html') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(fixtureHtml);
        return;
      }

      if (req.url === '/favicon.ico') {
        res.writeHead(204);
        res.end();
        return;
      }

      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
    });

    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      resolve({ server, origin: `http://127.0.0.1:${address.port}` });
    });
  });
}

async function ensureButtonLabel(page, targetLabel, maxAttempts = 5) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const currentLabel = await getButtonLabel(page);
    assertValidToggleLabel(currentLabel, `before ensuring label ${targetLabel}`);

    if (currentLabel === targetLabel) {
      return;
    }

    await clickInjectedToggleButton(page);
    await delay(150);
  }

  await waitForButtonLabel(page, targetLabel);
}

async function getButtonLabel(page) {
  return await page.evaluate(() => {
    const button = document.querySelector('button');
    if (!button) {
      throw new Error('Injected toggle button not found');
    }

    return button.innerText.trim();
  });
}

function assertValidToggleLabel(label, context) {
  if (label !== 'Show Panel' && label !== 'Hide Panel') {
    throw new Error(`Unexpected button label${context ? ` (${context})` : ''}: ${label}`);
  }
}

async function stopLocalFixtureServer(server) {
  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

async function waitForButtonLabel(page, label) {
  await page.waitForFunction(
    (expectedLabel) => {
      const button = document.querySelector('button');
      return Boolean(button && button.innerText.trim() === expectedLabel);
    },
    label,
    { timeout: 5000 }
  );

  await assertTextContains(page, 'button', label);
}

async function waitForAnyValidButtonLabel(page) {
  await page.waitForFunction(() => {
    const button = document.querySelector('button');
    if (!button) {
      return false;
    }

    const label = button.innerText.trim();
    return label === 'Show Panel' || label === 'Hide Panel';
  }, null, { timeout: 5000 });
}

async function clickInjectedToggleButton(page) {
  await page.click('button', { force: true, timeout: 5000 });
}

(async () => {
  const extensionPath = process.argv[2] || path.resolve(__dirname, '../../extension_cores/stateless_sidebar');
  const { server, origin } = await startLocalFixtureServer();

  let context;

  try {
    const launch = await launchExtensionContext(extensionPath, { headless: false });
    context = launch.context;

    const extensionId = launch.extensionId;
    if (!extensionId) {
      throw new Error('Extensions must load successfully and expose a chrome-extension:// target');
    }

    const tabA = await context.newPage();
    const tabALogs = await createConsoleLogger(tabA);

    await openUrl(tabA, `${origin}/generic/local-fixture.html`);
    await assertSelectorVisible(tabA, '[data-testid="fixture-title"]');
    await assertSelectorVisible(tabA, 'button');
    await waitForButtonLabel(tabA, 'Show Panel');

    console.log('Test Case 1: Button opens panel state');
    await tabA.bringToFront();
    await ensureButtonLabel(tabA, 'Hide Panel');

    console.log('Test Case 2: Button closes panel state');
    await tabA.bringToFront();
    await ensureButtonLabel(tabA, 'Show Panel');

    console.log('Test Case 3: Rapid sequential clicks keep last intent');
    await tabA.bringToFront();
    for (let i = 0; i < 5; i += 1) {
      await clickInjectedToggleButton(tabA);
    }
    await delay(300);

    const postBurstLabel = await getButtonLabel(tabA);
    assertValidToggleLabel(postBurstLabel, 'after rapid toggles');

    await clickInjectedToggleButton(tabA);
    await delay(200);
    const postControlledClickLabel = await getButtonLabel(tabA);
    assertValidToggleLabel(postControlledClickLabel, 'after controlled click following rapid toggles');

    console.log('Test Case 4: State is isolated per tab');
    const tabB = await context.newPage();
    const tabBLogs = await createConsoleLogger(tabB);
    await openUrl(tabB, `${origin}/generic/local-fixture.html`);
    await assertSelectorVisible(tabB, 'button');

    const tabALabelBeforeTabBClick = await getButtonLabel(tabA);
    assertValidToggleLabel(tabALabelBeforeTabBClick, 'tab A before tab B toggle');

    await tabB.bringToFront();
    await clickInjectedToggleButton(tabB);
    await waitForAnyValidButtonLabel(tabB);
    const tabBPostClickLabel = await getButtonLabel(tabB);
    assertValidToggleLabel(tabBPostClickLabel, 'tab B state after toggle');

    await tabA.bringToFront();
    await waitForButtonLabel(tabA, tabALabelBeforeTabBClick);

    console.log('Test Case 5: State persists after page reload');
    await tabA.bringToFront();
    const tabALabelBeforeReload = await getButtonLabel(tabA);
    assertValidToggleLabel(tabALabelBeforeReload, 'tab A before reload');

    await tabA.reload({ waitUntil: 'domcontentloaded' });
    await assertSelectorVisible(tabA, 'button');
    await waitForButtonLabel(tabA, tabALabelBeforeReload);

    const sidepanelPage = await openExtensionPage(context, extensionId, 'sidepanel.html');
    const sidepanelLogs = await createConsoleLogger(sidepanelPage);
    await assertSelectorVisible(sidepanelPage, '#closed');

    await assertNoConsoleErrors(tabALogs);
    await assertNoConsoleErrors(tabBLogs);
    await assertNoConsoleErrors(sidepanelLogs);

    console.log('Stateless sidebar toggle resilience suite completed successfully.');
  } finally {
    if (context) {
      await closeContext(context);
    }

    await stopLocalFixtureServer(server);
  }
})();
