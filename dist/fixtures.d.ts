import { Page, BrowserContext } from '@playwright/test';
import { LaunchExtensionOptions } from './types';
export interface ExtensionFixtures {
    extensionPath: string;
    extensionLaunchOptions: Partial<LaunchExtensionOptions>;
    extensionContext: BrowserContext;
    extensionId: string;
    sidepanelPage: Page;
}
export declare const test: import("@playwright/test").TestType<import("@playwright/test").PlaywrightTestArgs & import("@playwright/test").PlaywrightTestOptions & ExtensionFixtures, import("@playwright/test").PlaywrightWorkerArgs & import("@playwright/test").PlaywrightWorkerOptions>;
export { expect } from '@playwright/test';
//# sourceMappingURL=fixtures.d.ts.map