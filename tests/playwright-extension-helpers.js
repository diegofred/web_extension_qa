const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

async function launchExtensionContext(extensionPath, options = {}) {
  const resolved = path.resolve(extensionPath);
  assert(fs.existsSync(resolved), `Extension path not found: ${resolved}`);

  const userDataDir = options.userDataDir || path.join(__dirname, '.tmp_profile');
  const browserArgs = [
    `--disable-extensions-except=${resolved}`,
    `--load-extension=${resolved}`,
    '--no-sandbox'
  ];

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: options.headless ?? false,
    args: browserArgs,
    viewport: options.viewport || { width: 1280, height: 800 },
  });

  const page = await context.newPage();
  const client = await context.newCDPSession(page);
  const extensionId = await findExtensionId(client);

  return { context, page, extensionId, extensionPath: resolved };
}

async function findExtensionId(client) {
  const res = await client.send('Target.getTargets');
  const targets = res.targetInfos || [];
  const ext = targets.find(t => t.url && t.url.startsWith('chrome-extension://'));
  if (!ext) return null;
  const parts = ext.url.split('/');
  return parts[2];
}

async function openUrl(page, url, options = {}) {
  try {
    return await page.goto(url, { waitUntil: options.waitUntil || 'domcontentloaded', timeout: options.timeout || 30000 });
  } catch (error) {
    console.warn(`Initial navigation to ${url} failed:`, error.message);
    return await page.goto(url, { waitUntil: 'load', timeout: options.timeout || 45000 });
  }
}

async function waitForText(page, selectorOrText, options = {}) {
  if (selectorOrText.startsWith('text=')) {
    return await page.waitForSelector(selectorOrText, { timeout: options.timeout || 5000 });
  }
  return await page.waitForSelector(selectorOrText, { timeout: options.timeout || 5000 });
}

async function assertSelectorVisible(page, selector, options = {}) {
  const element = await page.waitForSelector(selector, { timeout: options.timeout || 5000, state: 'visible' });
  assert(element, `Expected selector to be visible: ${selector}`);
  return element;
}

async function assertSelectorExists(page, selector, options = {}) {
  const element = await page.waitForSelector(selector, { timeout: options.timeout || 5000, state: 'attached' });
  assert(element, `Expected selector to exist: ${selector}`);
  return element;
}

async function assertTextContains(page, selector, expected, options = {}) {
  const text = await page.textContent(selector, { timeout: options.timeout || 5000 });
  assert(text !== null, `Selector not found: ${selector}`);
  assert(text.includes(expected), `Expected text for ${selector} to contain '${expected}', got '${text.trim()}'`);
  return text;
}

async function assertTextEquals(page, selector, expected, options = {}) {
  const text = await page.textContent(selector, { timeout: options.timeout || 5000 });
  assert(text !== null, `Selector not found: ${selector}`);
  assert(text.trim() === expected, `Expected text for ${selector} to equal '${expected}', got '${text.trim()}'`);
  return text;
}

async function assertUrlContains(page, expected, options = {}) {
  const url = page.url();
  assert(url.includes(expected), `Expected page URL to contain '${expected}', got '${url}'`);
  return url;
}

async function assertElementCount(page, selector, expectedCount, options = {}) {
  const elements = await page.$$(selector);
  assert(elements.length === expectedCount, `Expected ${expectedCount} elements for selector ${selector}, got ${elements.length}`);
  return elements;
}

async function assertNoConsoleErrors(entries) {
  const errors = entries.filter(entry => entry.type === 'error');
  assert(errors.length === 0, `Expected no console errors, found: ${errors.map(e => e.text).join(' | ')}`);
}

async function clickText(page, text, options = {}) {
  await page.click(`text=${text}`, { timeout: options.timeout || 5000 });
}

async function clickSelector(page, selector, options = {}) {
  await page.click(selector, { timeout: options.timeout || 5000 });
}

async function createConsoleLogger(page) {
  const entries = [];
  page.on('console', msg => {
    entries.push({ type: msg.type(), text: msg.text() });
  });
  page.on('pageerror', err => {
    entries.push({ type: 'error', text: err.message });
  });
  return entries;
}

function assertConsoleContains(entries, expectedText) {
  const found = entries.some(entry => entry.text.includes(expectedText));
  assert(found, `Expected console log to contain: ${expectedText}`);
}

async function openExtensionPage(context, extensionId, relativePath) {
  assert(extensionId, 'Extension id is required to open extension pages');
  const url = `chrome-extension://${extensionId}/${relativePath}`;
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'load' });
  return page;
}

async function openExtensionSidePanel(context, extensionId) {
  const page = await openExtensionPage(context, extensionId, 'sidepanel.html');
  const result = await page.evaluate(async () => {
    if (chrome.runtime.sendMessage.length === 1) {
      return await chrome.runtime.sendMessage({ type: 'OPEN_SIDE_PANEL' });
    }
    return await new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'OPEN_SIDE_PANEL' }, resolve);
    });
  });
  assert(result && result.success, `Failed to request sidepanel open: ${result?.error || 'unknown'}`);
  return page;
}

async function closeServiceWorker(context, extensionId, options = {}) {
  const delayMs = options.delayAfterClose || 500;
  const page = await context.newPage();
  try {
    await page.goto(`chrome-extension://${extensionId}/background.html`, { waitUntil: 'load', timeout: 5000 }).catch(() => {});
  } catch (e) {
    // Service worker may not have a background.html; this is acceptable
  }
  await page.close();
  await new Promise(resolve => setTimeout(resolve, delayMs));
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function closeContext(context) {
  await context.close();
}

module.exports = {
  assert,
  launchExtensionContext,
  findExtensionId,
  openUrl,
  waitForText,
  assertSelectorVisible,
  assertSelectorExists,
  assertTextContains,
  assertTextEquals,
  assertUrlContains,
  assertElementCount,
  assertNoConsoleErrors,
  clickText,
  clickSelector,
  createConsoleLogger,
  assertConsoleContains,
  openExtensionPage,
  openExtensionSidePanel,
  closeServiceWorker,
  delay,
  closeContext,
};
