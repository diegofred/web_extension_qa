import * as path from 'path';
import * as fs from 'fs';
import { chromium, BrowserContext, CDPSession } from '@playwright/test';
import { 
  LaunchExtensionOptions, 
  ExtensionContextSession, 
  ServiceWorkerCloseOptions 
} from './types';

export async function launchExtensionContext(
  extensionPath: string, 
  options: Partial<LaunchExtensionOptions> = {}
): Promise<ExtensionContextSession> {
  const resolved = path.resolve(extensionPath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Extension path not found: ${resolved}`);
  }

  const userDataDir = options.userDataDir || path.join(process.cwd(), '.tmp_profile');
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

  if (!extensionId) {
    throw new Error('Failed to discover Extension ID using CDP.');
  }

  return { context, page, extensionId, extensionPath: resolved };
}

export async function findExtensionId(client: CDPSession): Promise<string | null> {
  const res = await client.send('Target.getTargets');
  const targets = res.targetInfos || [];
  const ext = targets.find(t => t.url && t.url.startsWith('chrome-extension://'));
  if (!ext) return null;
  const parts = ext.url.split('/');
  return parts[2] || null;
}

export async function openExtensionPage(
  context: BrowserContext, 
  extensionId: string, 
  relativePath: string
) {
  const url = `chrome-extension://${extensionId}/${relativePath}`;
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'load' });
  return page;
}

export async function openExtensionSidePanel(
  context: BrowserContext, 
  extensionId: string
) {
  const page = await openExtensionPage(context, extensionId, 'sidepanel.html');
  const result = await page.evaluate(async () => {
    return await new Promise<{ success: boolean; error?: string }>((resolve) => {
      chrome.runtime.sendMessage({ type: 'OPEN_SIDE_PANEL' }, (res) => {
        resolve(res || { success: true });
      });
    });
  });

  if (!result || !result.success) {
    throw new Error(`Failed to request sidepanel open: ${result?.error || 'unknown'}`);
  }
  return page;
}

export async function closeServiceWorker(
  context: BrowserContext, 
  extensionId: string, 
  options: ServiceWorkerCloseOptions = {}
): Promise<void> {
  const delayMs = options.delayAfterClose || 500;
  const page = await context.newPage();
  try {
    await page.goto(`chrome-extension://${extensionId}/background.html`, { waitUntil: 'load', timeout: 5000 }).catch(() => {});
  } catch {
    // Service worker may not have background.html context
  }
  await page.close();
  await new Promise(resolve => setTimeout(resolve, delayMs));
}

export async function closeContext(context: BrowserContext): Promise<void> {
  await context.close();
}