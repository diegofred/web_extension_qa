import { test as base, Page, BrowserContext } from '@playwright/test';
import { launchExtensionContext, openExtensionSidePanel, closeContext } from './lifecycle';
import { LaunchExtensionOptions } from './types';

export interface ExtensionFixtures {
  extensionPath: string;
  extensionContext: BrowserContext;
  extensionId: string;
  sidepanelPage: Page;
}

export const test = base.extend<ExtensionFixtures>({
  // Default directory for unpacked extension output; users can override this in their tests or config
  extensionPath: [async ({}, use) => {
    await use('./dist');
  }, { option: true }],

  // Launches persistent browser context with extension loaded
  extensionContext: async ({ extensionPath }, use) => {
    const session = await launchExtensionContext(extensionPath);
    await use(session.context);
    await closeContext(session.context);
  },

  // Automatically extracts extension ID from the active context
  extensionId: async ({ extensionContext }, use) => {
    const page = extensionContext.pages()[0] || await extensionContext.newPage();
    const client = await extensionContext.newCDPSession(page);
    const res = await client.send('Target.getTargets');
    const targets = res.targetInfos || [];
    const ext = targets.find(t => t.url && t.url.startsWith('chrome-extension://'));
    
    if (!ext) {
      throw new Error('Extension ID not found in active targets');
    }
    
    const extensionId = ext.url.split('/')[2];
    await use(extensionId);
  },

  // Provides an initialized sidepanel page ready for testing
  sidepanelPage: async ({ extensionContext, extensionId }, use) => {
    const page = await openExtensionSidePanel(extensionContext, extensionId);
    await use(page);
    await page.close();
  },
});

export { expect } from '@playwright/test';