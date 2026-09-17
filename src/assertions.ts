import { expect, Page } from '@playwright/test';
import { AssertionOptions, CapturedConsoleEntry } from './types';

export async function assertSelectorVisible(
  page: Page, 
  selector: string, 
  options: AssertionOptions = {}
) {
  const locator = page.locator(selector);
  await expect(locator).toBeVisible({ timeout: options.timeout || 5000 });
}

export async function assertSelectorExists(
  page: Page, 
  selector: string, 
  options: AssertionOptions = {}
) {
  const locator = page.locator(selector);
  await expect(locator).toBeAttached({ timeout: options.timeout || 5000 });
}

export async function assertTextContains(
  page: Page, 
  selector: string, 
  expected: string, 
  options: AssertionOptions = {}
) {
  const locator = page.locator(selector);
  await expect(locator).toContainText(expected, { timeout: options.timeout || 5000 });
}

export async function assertTextEquals(
  page: Page, 
  selector: string, 
  expected: string, 
  options: AssertionOptions = {}
) {
  const locator = page.locator(selector);
  await expect(locator).toHaveText(expected, { timeout: options.timeout || 5000 });
}

export async function assertUrlContains(
  page: Page, 
  expected: string, 
  options: AssertionOptions = {}
) {
  await expect(page).toHaveURL(new RegExp(expected), { timeout: options.timeout || 5000 });
}

export async function assertElementCount(
  page: Page, 
  selector: string, 
  expectedCount: number, 
  options: AssertionOptions = {}
) {
  const locator = page.locator(selector);
  await expect(locator).toHaveCount(expectedCount, { timeout: options.timeout || 5000 });
}

export function createConsoleLogger(page: Page): CapturedConsoleEntry[] {
  const entries: CapturedConsoleEntry[] = [];
  page.on('console', msg => {
    entries.push({ type: msg.type(), text: msg.text(), timestamp: Date.now() });
  });
  page.on('pageerror', err => {
    entries.push({ type: 'error', text: err.message, timestamp: Date.now() });
  });
  return entries;
}

export function assertNoConsoleErrors(entries: CapturedConsoleEntry[]): void {
  const errors = entries.filter(entry => entry.type === 'error');
  if (errors.length > 0) {
    throw new Error(`Expected no console errors, found: ${errors.map(e => e.text).join(' | ')}`);
  }
}

export function assertConsoleContains(entries: CapturedConsoleEntry[], expectedText: string): void {
  const found = entries.some(entry => entry.text.includes(expectedText));
  if (!found) {
    throw new Error(`Expected console log to contain: '${expectedText}'`);
  }
}