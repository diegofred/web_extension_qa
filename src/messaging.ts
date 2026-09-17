import { Page } from '@playwright/test';
import { AssertionOptions } from './types';

export async function sendMessageFromContent<T = unknown, R = unknown>(
  page: Page, 
  type: string, 
  payload: T = {} as T, 
  options: AssertionOptions = {}
): Promise<R> {
  return await page.evaluate(
    async ({ type, payload, timeout }) => {
      const requestId = Math.random().toString(36).slice(2);
      return await new Promise<R>((resolve, reject) => {
        const timer = setTimeout(() => {
          document.removeEventListener('__sidecarSendMessageResponse', handler as EventListener);
          reject(new Error('sendMessageFromContent response timeout'));
        }, timeout || 5000);

        function handler(event: CustomEvent) {
          const detail = event.detail || {};
          if (detail.requestId !== requestId) return;
          clearTimeout(timer);
          document.removeEventListener('__sidecarSendMessageResponse', handler as EventListener);
          resolve(detail.response);
        }

        document.addEventListener('__sidecarSendMessageResponse', handler as EventListener);
        document.dispatchEvent(new CustomEvent('__sidecarSendMessage', {
          detail: { type, payload, requestId }
        }));
      });
    },
    { type, payload, timeout: options.timeout }
  );
}

export async function waitForDelivery(
  page: Page, 
  checkExpression: string, 
  options: AssertionOptions = {}
): Promise<boolean> {
  const timeout = options.timeout || 5000;
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const ok = await page.evaluate(checkExpression);
    if (ok) return true;
    await new Promise(res => setTimeout(res, 100));
  }
  throw new Error('Message delivery check timed out');
}