import { Page } from '@playwright/test';
import { AssertionOptions, DeliveryCheck } from './types';

export async function sendMessageFromContent<T = unknown, R = unknown>(
  page: Page,
  type: string,
  payload?: T,
  options: AssertionOptions = {}
): Promise<R> {
  return page.evaluate(
    async ({ type: messageType, payload: messagePayload, timeout }) => {
      const requestId = Math.random().toString(36).slice(2);
      return new Promise<R>((resolve, reject) => {
        const timer = setTimeout(() => {
          document.removeEventListener('__sidecarSendMessageResponse', handler as EventListener);
          reject(new Error('sendMessageFromContent response timeout'));
        }, timeout ?? 5000);

        function handler(event: Event) {
          const detail = (event as CustomEvent).detail || {};
          if (detail.requestId !== requestId) return;
          clearTimeout(timer);
          document.removeEventListener('__sidecarSendMessageResponse', handler as EventListener);
          resolve(detail.response as R);
        }

        document.addEventListener('__sidecarSendMessageResponse', handler as EventListener);
        document.dispatchEvent(new CustomEvent('__sidecarSendMessage', {
          detail: { type: messageType, payload: messagePayload, requestId },
        }));
      });
    },
    { type, payload, timeout: options.timeout }
  );
}

export async function waitForDelivery(
  page: Page,
  checkExpression: DeliveryCheck,
  options: AssertionOptions = {}
): Promise<boolean> {
  const timeout = options.timeout ?? 5000;
  const start = Date.now();

  while (Date.now() - start < timeout) {
    const delivered = typeof checkExpression === 'string'
      ? await page.evaluate(checkExpression)
      : await page.evaluate(checkExpression);

    if (delivered) return true;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error('Message delivery check timed out');
}
