"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessageFromContent = sendMessageFromContent;
exports.waitForDelivery = waitForDelivery;
async function sendMessageFromContent(page, type, payload, options = {}) {
    return page.evaluate(async ({ type: messageType, payload: messagePayload, timeout }) => {
        const requestId = Math.random().toString(36).slice(2);
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                document.removeEventListener('__sidecarSendMessageResponse', handler);
                reject(new Error('sendMessageFromContent response timeout'));
            }, timeout ?? 5000);
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
                detail: { type: messageType, payload: messagePayload, requestId },
            }));
        });
    }, { type, payload, timeout: options.timeout });
}
async function waitForDelivery(page, checkExpression, options = {}) {
    const timeout = options.timeout ?? 5000;
    const start = Date.now();
    while (Date.now() - start < timeout) {
        const delivered = typeof checkExpression === 'string'
            ? await page.evaluate(checkExpression)
            : await page.evaluate(checkExpression);
        if (delivered)
            return true;
        await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error('Message delivery check timed out');
}
//# sourceMappingURL=messaging.js.map