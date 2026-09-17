import { BrowserContext, CDPSession, Page } from '@playwright/test';
import { LaunchExtensionOptions, ExtensionContextSession, ServiceWorkerCloseOptions } from './types';
export declare function launchExtensionContext(options: LaunchExtensionOptions): Promise<ExtensionContextSession>;
export declare function findExtensionId(client: CDPSession): Promise<string | null>;
export declare function openExtensionPage(context: BrowserContext, extensionId: string, relativePath: string): Promise<Page>;
export declare function openExtensionSidePanel(context: BrowserContext, extensionId: string): Promise<Page>;
export declare function closeServiceWorker(context: BrowserContext, extensionId: string, options?: ServiceWorkerCloseOptions): Promise<void>;
export declare function closeContext(context: BrowserContext): Promise<void>;
//# sourceMappingURL=lifecycle.d.ts.map