import {
  createStrictPerTabSidePanelController,
  SIDE_PANEL_MESSAGE_TYPES,
} from './lib/sidepanel-controller.js';

const PANEL_PATH = '/sidepanel.html';
const TAB_STATE_STORAGE_KEY = 'side_panel_tab_state_map';

const activationSyncMap = new Map();

function getLastErrorMessage() {
  return chrome.runtime.lastError?.message || null;
}

function setSidePanelOptionsCompat(options) {
  return new Promise((resolve, reject) => {
    try {
      chrome.sidePanel.setOptions(options, () => {
        const errorMessage = getLastErrorMessage();
        if (errorMessage) {
          reject(new Error(errorMessage));
          return;
        }

        resolve();
      });
    } catch (error) {
      reject(error);
    }
  });
}

function openSidePanelCompat(options) {
  return new Promise((resolve, reject) => {
    try {
      chrome.sidePanel.open(options, () => {
        const errorMessage = getLastErrorMessage();
        if (errorMessage) {
          reject(new Error(errorMessage));
          return;
        }

        resolve();
      });
    } catch (error) {
      reject(error);
    }
  });
}

const controller = createStrictPerTabSidePanelController(
  {
    resolveActiveTabId: async () => {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      return activeTab?.id;
    },
    setSidePanelOptions: setSidePanelOptionsCompat,
    openSidePanel: openSidePanelCompat,
    sendRuntimeMessage: message => chrome.runtime.sendMessage(message),
    storageGet: key => chrome.storage.local.get(key),
    storageSet: value => chrome.storage.local.set(value),
  },
  {
    panelPath: PANEL_PATH,
    tabStateStorageKey: TAB_STATE_STORAGE_KEY,
  },
);

async function syncAllTabs() {
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (tab.id === undefined || tab.id === null) {
      continue;
    }

    const result = await controller.syncTabActivation(tab.id);
    activationSyncMap.set(tab.id, result.enabled);
  }
}

async function handleOpenForTab(tabId) {
  if (tabId === undefined || tabId === null) {
    return { success: false, reason: 'Missing tab id' };
  }

  const result = await controller.open(tabId);
  activationSyncMap.set(tabId, true);

  return {
    success: result.success,
    tabId: result.tabId,
    open: true,
  };
}

async function handleCloseForTab(tabId, force = false) {
  if (tabId === undefined || tabId === null) {
    return { success: false, reason: 'Missing tab id' };
  }

  const result = await controller.close(tabId, force);
  activationSyncMap.set(tabId, false);

  return {
    success: result.success,
    tabId: result.tabId,
    open: false,
  };
}

chrome.runtime.onInstalled.addListener(async () => {
  await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });
  await syncAllTabs();
});

chrome.runtime.onStartup.addListener(async () => {
  await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });
  await syncAllTabs();
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const result = await controller.syncTabActivation(tabId);
  activationSyncMap.set(tabId, result.enabled);
});

chrome.tabs.onRemoved.addListener(tabId => {
  activationSyncMap.delete(tabId);
  void controller.setTabOpenState(tabId, false);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  void (async () => {
    const senderTabId = sender.tab?.id;

    if (message?.type === SIDE_PANEL_MESSAGE_TYPES.OPEN || message?.type === 'OPEN_SIDE_PANEL_FOR_TAB') {
      const tabId = message.tabId ?? senderTabId;
      sendResponse(await handleOpenForTab(tabId));
      return;
    }

    if (message?.type === SIDE_PANEL_MESSAGE_TYPES.CLOSE || message?.type === 'CLOSE_SIDE_PANEL_FOR_TAB') {
      const tabId = message.tabId ?? senderTabId;
      sendResponse(await handleCloseForTab(tabId, Boolean(message.force)));
      return;
    }

    if (message?.type === 'GET_TAB_PANEL_STATE') {
      const tabId = message.tabId ?? senderTabId;
      sendResponse({
        success: true,
        tabId,
        open: tabId === undefined || tabId === null ? false : await controller.isTabOpen(tabId),
      });
      return;
    }

    if (message?.type === 'DEBUG_GET_ALL_STATES') {
      const map = await controller.getTabStateMap();
      sendResponse({
        success: true,
        tabStateMap: map,
        activationSyncMap: Object.fromEntries(activationSyncMap.entries()),
      });
      return;
    }

    if (message?.type === 'OPEN_SIDE_PANEL') {
      // Compatibility with generic helper in tests/playwright-extension-helpers.js.
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      sendResponse(await handleOpenForTab(activeTab?.id));
      return;
    }

    sendResponse({ success: false, reason: 'Unhandled message type' });
  })().catch(error => {
    sendResponse({
      success: false,
      reason: error instanceof Error ? error.message : 'Unknown error',
    });
  });

  return true;
});
