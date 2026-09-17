import * as path from 'path';
import * as fs from 'fs';
import { chromium, BrowserContext, CDPSession, Page } from '@playwright/test';
import {
  LaunchExtensionOptions,
  ExtensionContextSession,
  ServiceWorkerCloseOptions,
} from './types';

export async function launchExtensionContext(
  options: LaunchExtensionOptions
): Promise<ExtensionContextSession> {
  const resolved = path.resolve(options.extensionPath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Extension path not found: ${resolved}`);
  }

  const userDataDir = options.userDataDir || path.join(process.cwd(), '.tmp_profile');
  const browserArgs = [
    `--disable-extensions-except=${resolved}`,
    `--load-extension=${resolved}`,
    '--no-sandbox',
  ];

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: options.headless ?? false,
    args: browserArgs,
    viewport: options.viewport || { width: 1280, height: 800 },
  });

  const page = await context.newPage();
  const client = await context.newCDPSession(page);
  const extensionId = await findExtensionId(client);

  if (!extensionId) {
    await context.close();
    throw new Error('Failed to discover Extension ID using CDP.');
  }

  return { context, page, extensionId, extensionPath: resolved };
}

export async function findExtensionId(client: CDPSession): Promise<string | null> {
  const res = await client.send('Target.getTargets');
  const targets = res.targetInfos || [];
  const ext = targets.find((target) => target.url?.startsWith('chrome-extension://'));
  if (!ext) return null;
  return ext.url.split('/')[2] || null;
}

export async function openExtensionPage(
  context: BrowserContext,
  extensionId: string,
  relativePath: string
): Promise<Page> {
  const url = `chrome-extension://${extensionId}/${relativePath}`;
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'load' });
  return page;
}

export async function openExtensionSidePanel(
  context: BrowserContext,
  extensionId: string
): Promise<Page> {
  const page = await openExtensionPage(context, extensionId, 'sidepanel.html');
  await page.waitForLoadState('domcontentloaded');
  return page;
}

export async function closeServiceWorker(
  context: BrowserContext,
  extensionId: string,
  options: ServiceWorkerCloseOptions = {}
): Promise<void> {
  const page = context.pages()[0] || await context.newPage();
  const client = await context.newCDPSession(page);
  const { targetInfos } = await client.send('Target.getTargets');
  const worker = (targetInfos || []).find(
    (target) => target.type === 'service_worker' && target.url?.startsWith(`chrome-extension://${extensionId}/`)
  );

  // Service worker may not have a background.html page; close its CDP target directly.

  if (worker) {
    await client.send('Target.closeTarget', { targetId: worker.targetId });
  }

  const delayMs = options.delayAfterClose ?? 500;
  await new Promise((resolve) => setTimeout(resolve, delayMs));
}

export async function closeContext(context: BrowserContext): Promise<void> {
  await context.close();
}
