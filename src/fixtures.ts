import { test as base, Page, BrowserContext } from '@playwright/test';
import { launchExtensionContext, openExtensionSidePanel, closeContext } from './lifecycle';
import { LaunchExtensionOptions } from './types';

export interface ExtensionFixtures {
  extensionPath: string;
  extensionLaunchOptions: Partial<LaunchExtensionOptions>;
  extensionContext: BrowserContext;
  extensionId: string;
  sidepanelPage: Page;
}

export const test = base.extend<ExtensionFixtures>({
  // Default directory for unpacked extension output; users can override this in their tests or config
  extensionPath: ['./dist', { option: true }],

  extensionLaunchOptions: [{}, { option: true }],

  // Launches persistent browser context with extension loaded
  extensionContext: async ({ extensionPath, extensionLaunchOptions }, use) => {
    const session = await launchExtensionContext({
      ...extensionLaunchOptions,
      extensionPath: extensionLaunchOptions.extensionPath ?? extensionPath,
    });
    await use(session.context);
    await closeContext(session.context);
  },

  extensionId: async ({ extensionContext }, use) => {
    const page = extensionContext.pages()[0] || await extensionContext.newPage();
    const client = await extensionContext.newCDPSession(page);
    const res = await client.send('Target.getTargets');
    const target = (res.targetInfos || []).find((info) => info.url?.startsWith('chrome-extension://'));

    if (!target) {
      throw new Error('Extension ID not found in active targets');
    }

    await use(target.url.split('/')[2]);
  },

  sidepanelPage: async ({ extensionContext, extensionId }, use) => {
    const page = await openExtensionSidePanel(extensionContext, extensionId);
    try {
      await use(page);
    } finally {
      await page.close();
    }
  },
});

export { expect } from '@playwright/test';
