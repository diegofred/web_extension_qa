import { Page } from '@playwright/test';
import { AssertionOptions, CapturedConsoleEntry } from './types';
export declare function assertSelectorVisible(page: Page, selector: string, options?: AssertionOptions): Promise<void>;
export declare function assertSelectorExists(page: Page, selector: string, options?: AssertionOptions): Promise<void>;
export declare function assertTextContains(page: Page, selector: string, expected: string, options?: AssertionOptions): Promise<void>;
export declare function assertTextEquals(page: Page, selector: string, expected: string, options?: AssertionOptions): Promise<void>;
export declare function assertUrlContains(page: Page, expected: string, options?: AssertionOptions): Promise<void>;
export declare function assertElementCount(page: Page, selector: string, expectedCount: number, options?: AssertionOptions): Promise<void>;
export declare function createConsoleLogger(page: Page): CapturedConsoleEntry[];
export declare function assertNoConsoleErrors(entries: CapturedConsoleEntry[]): void;
export declare function assertConsoleContains(entries: CapturedConsoleEntry[], expectedText: string): void;
//# sourceMappingURL=assertions.d.ts.map