"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expect = exports.test = void 0;
const test_1 = require("@playwright/test");
const lifecycle_1 = require("./lifecycle");
exports.test = test_1.test.extend({
    // Default directory for unpacked extension output; users can override this in their tests or config
    extensionPath: ['./dist', { option: true }],
    extensionLaunchOptions: [{}, { option: true }],
    // Launches persistent browser context with extension loaded
    extensionContext: async ({ extensionPath, extensionLaunchOptions }, use) => {
        const session = await (0, lifecycle_1.launchExtensionContext)({
            ...extensionLaunchOptions,
            extensionPath: extensionLaunchOptions.extensionPath ?? extensionPath,
        });
        await use(session.context);
        await (0, lifecycle_1.closeContext)(session.context);
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
        const page = await (0, lifecycle_1.openExtensionSidePanel)(extensionContext, extensionId);
        try {
            await use(page);
        }
        finally {
            await page.close();
        }
    },
});
var test_2 = require("@playwright/test");
Object.defineProperty(exports, "expect", { enumerable: true, get: function () { return test_2.expect; } });
//# sourceMappingURL=fixtures.js.map