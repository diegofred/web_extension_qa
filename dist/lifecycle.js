"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.launchExtensionContext = launchExtensionContext;
exports.findExtensionId = findExtensionId;
exports.openExtensionPage = openExtensionPage;
exports.openExtensionSidePanel = openExtensionSidePanel;
exports.closeServiceWorker = closeServiceWorker;
exports.closeContext = closeContext;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const test_1 = require("@playwright/test");
async function launchExtensionContext(extensionPath, options = {}) {
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
    const context = await test_1.chromium.launchPersistentContext(userDataDir, {
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
async function findExtensionId(client) {
    const res = await client.send('Target.getTargets');
    const targets = res.targetInfos || [];
    const ext = targets.find(t => t.url && t.url.startsWith('chrome-extension://'));
    if (!ext)
        return null;
    const parts = ext.url.split('/');
    return parts[2] || null;
}
async function openExtensionPage(context, extensionId, relativePath) {
    const url = `chrome-extension://${extensionId}/${relativePath}`;
    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'load' });
    return page;
}
async function openExtensionSidePanel(context, extensionId) {
    const page = await openExtensionPage(context, extensionId, 'sidepanel.html');
    const result = await page.evaluate(async () => {
        return await new Promise((resolve) => {
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
async function closeServiceWorker(context, extensionId, options = {}) {
    const delayMs = options.delayAfterClose || 500;
    const page = await context.newPage();
    try {
        await page.goto(`chrome-extension://${extensionId}/background.html`, { waitUntil: 'load', timeout: 5000 }).catch(() => { });
    }
    catch {
        // Service worker may not have background.html context
    }
    await page.close();
    await new Promise(resolve => setTimeout(resolve, delayMs));
}
async function closeContext(context) {
    await context.close();
}
//# sourceMappingURL=lifecycle.js.map