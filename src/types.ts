import { BrowserContext, Page } from '@playwright/test';

export interface LaunchExtensionOptions {
  extensionPath: string;
  userDataDir?: string;
  headless?: boolean;
  viewport?: { width: number; height: number };
}

export interface ExtensionContextSession {
  context: BrowserContext;
  page: Page;
  extensionId: string;
  extensionPath: string;
}

export interface CapturedConsoleEntry {
  type: string;
  text: string;
  timestamp: number;
}

export interface AssertionOptions {
  timeout?: number;
}

export interface ServiceWorkerCloseOptions {
  delayAfterClose?: number;
}

export interface ExtensionMessage<T = unknown> {
  type: string;
  payload?: T;
  requestId?: string;
}