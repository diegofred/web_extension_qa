import { Page } from '@playwright/test';
import { AssertionOptions } from './types';
export declare function sendMessageFromContent<T = unknown, R = unknown>(page: Page, type: string, payload?: T, options?: AssertionOptions): Promise<R>;
export declare function waitForDelivery(page: Page, checkExpression: string, options?: AssertionOptions): Promise<boolean>;
//# sourceMappingURL=messaging.d.ts.map