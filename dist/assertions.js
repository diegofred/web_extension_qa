"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertSelectorVisible = assertSelectorVisible;
exports.assertSelectorExists = assertSelectorExists;
exports.assertTextContains = assertTextContains;
exports.assertTextEquals = assertTextEquals;
exports.assertUrlContains = assertUrlContains;
exports.assertElementCount = assertElementCount;
exports.createConsoleLogger = createConsoleLogger;
exports.assertNoConsoleErrors = assertNoConsoleErrors;
exports.assertConsoleContains = assertConsoleContains;
const test_1 = require("@playwright/test");
async function assertSelectorVisible(page, selector, options = {}) {
    const locator = page.locator(selector);
    await (0, test_1.expect)(locator).toBeVisible({ timeout: options.timeout || 5000 });
}
async function assertSelectorExists(page, selector, options = {}) {
    const locator = page.locator(selector);
    await (0, test_1.expect)(locator).toBeAttached({ timeout: options.timeout || 5000 });
}
async function assertTextContains(page, selector, expected, options = {}) {
    const locator = page.locator(selector);
    await (0, test_1.expect)(locator).toContainText(expected, { timeout: options.timeout || 5000 });
}
async function assertTextEquals(page, selector, expected, options = {}) {
    const locator = page.locator(selector);
    await (0, test_1.expect)(locator).toHaveText(expected, { timeout: options.timeout || 5000 });
}
async function assertUrlContains(page, expected, options = {}) {
    await (0, test_1.expect)(page).toHaveURL(new RegExp(expected), { timeout: options.timeout || 5000 });
}
async function assertElementCount(page, selector, expectedCount, options = {}) {
    const locator = page.locator(selector);
    await (0, test_1.expect)(locator).toHaveCount(expectedCount, { timeout: options.timeout || 5000 });
}
function createConsoleLogger(page) {
    const entries = [];
    page.on('console', msg => {
        entries.push({ type: msg.type(), text: msg.text(), timestamp: Date.now() });
    });
    page.on('pageerror', err => {
        entries.push({ type: 'error', text: err.message, timestamp: Date.now() });
    });
    return entries;
}
function assertNoConsoleErrors(entries) {
    const errors = entries.filter(entry => entry.type === 'error');
    if (errors.length > 0) {
        throw new Error(`Expected no console errors, found: ${errors.map(e => e.text).join(' | ')}`);
    }
}
function assertConsoleContains(entries, expectedText) {
    const found = entries.some(entry => entry.text.includes(expectedText));
    if (!found) {
        throw new Error(`Expected console log to contain: '${expectedText}'`);
    }
}
//# sourceMappingURL=assertions.js.map