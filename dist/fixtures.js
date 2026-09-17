"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expect = exports.test = void 0;
const test_1 = require("@playwright/test");
const lifecycle_1 = require("./lifecycle");
exports.test = test_1.test.extend({
    // Default directory for unpacked extension output; users can override this in their tests or config
    extensionPath: [async ({}, use) => {
            await use('./dist');
        }, { option: true }],
    // Launches persistent browser context with extension loaded
    extensionContext: async ({ extensionPath }, use) => {
        const session = await (0, lifecycle_1.launchExtensionContext)(extensionPath);
        await use(session.context);
        await (0, lifecycle_1.closeContext)(session.context);
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
        const page = await (0, lifecycle_1.openExtensionSidePanel)(extensionContext, extensionId);
        await use(page);
        await page.close();
    },
});
var test_2 = require("@playwright/test");
Object.defineProperty(exports, "expect", { enumerable: true, get: function () { return test_2.expect; } });
//# sourceMappingURL=fixtures.js.map