"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessageFromContent = sendMessageFromContent;
exports.waitForDelivery = waitForDelivery;
async function sendMessageFromContent(page, type, payload = {}, options = {}) {
    return await page.evaluate(async ({ type, payload, timeout }) => {
        const requestId = Math.random().toString(36).slice(2);
        return await new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                document.removeEventListener('__sidecarSendMessageResponse', handler);
                reject(new Error('sendMessageFromContent response timeout'));
            }, timeout || 5000);
            function handler(event) {
                const detail = event.detail || {};
                if (detail.requestId !== requestId)
                    return;
                clearTimeout(timer);
                document.removeEventListener('__sidecarSendMessageResponse', handler);
                resolve(detail.response);
            }
            document.addEventListener('__sidecarSendMessageResponse', handler);
            document.dispatchEvent(new CustomEvent('__sidecarSendMessage', {
                detail: { type, payload, requestId }
            }));
        });
    }, { type, payload, timeout: options.timeout });
}
async function waitForDelivery(page, checkExpression, options = {}) {
    const timeout = options.timeout || 5000;
    const start = Date.now();
    while (Date.now() - start < timeout) {
        const ok = await page.evaluate(checkExpression);
        if (ok)
            return true;
        await new Promise(res => setTimeout(res, 100));
    }
    throw new Error('Message delivery check timed out');
}
//# sourceMappingURL=messaging.js.map