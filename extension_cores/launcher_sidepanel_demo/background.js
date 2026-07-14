const SIDE_PANEL_MESSAGE_TYPES = Object.freeze({
  OPEN: 'open_side_panel',
  CLOSE: 'close_side_panel',
});

const PANEL_PATH = 'sidepanel.html';
const PANEL_STATE_KEY = 'launcher_demo_panel_state';

function assertAdapter(name, value) {
  if (typeof value !== 'function') {
    throw new TypeError(`Missing required side panel adapter: ${name}`);
  }
}

function getTabIdFromCandidate(candidate) {
  if (!candidate) {
    return undefined;
  }

  if (typeof candidate === 'number' || typeof candidate === 'string') {
    return candidate;
  }

  return candidate.tabId ?? candidate.id ?? candidate.tab?.id;
}

function createSidePanelController(adapters) {
  const {
    resolveActiveTabId,
    resolveWindowIdForTab,
    setSidePanelOptions,
    openSidePanel,
    storageSet,
    now = () => Date.now(),
  } = adapters;

  assertAdapter('resolveActiveTabId', resolveActiveTabId);
  assertAdapter('setSidePanelOptions', setSidePanelOptions);
  assertAdapter('openSidePanel', openSidePanel);
  assertAdapter('storageSet', storageSet);

  async function resolveTargetTabId(tabId) {
    const resolvedTabId = getTabIdFromCandidate(tabId);
    if (resolvedTabId !== undefined && resolvedTabId !== null) {
      return resolvedTabId;
    }

    return resolveActiveTabId();
  }

  async function setOpenRecord(tabId) {
    await storageSet({
      side_panel_open: {
        timestamp: now(),
        tabId,
      },
    });
  }

  async function open(tabId) {
    const targetTabId = await resolveTargetTabId(tabId);
    if (targetTabId === undefined || targetTabId === null) {
      return { success: false, tabId: null };
    }

    await setSidePanelOptions({
      tabId: targetTabId,
      enabled: true,
      path: PANEL_PATH,
    });

    let openedWithApi = false;
    let openError = null;
    try {
      await openSidePanel({ tabId: targetTabId });
      openedWithApi = true;
    } catch (error) {
      openError = error;

      if (typeof resolveWindowIdForTab === 'function') {
        try {
          const windowId = await resolveWindowIdForTab(targetTabId);
          if (windowId !== undefined && windowId !== null) {
            await openSidePanel({ windowId });
            openedWithApi = true;
            openError = null;
          }
        } catch (fallbackError) {
          openError = fallbackError;
        }
      }
    }

    if (!openedWithApi) {
      return {
        success: false,
        tabId: targetTabId,
        error: openError?.message || 'Side panel open failed.',
      };
    }

    await setOpenRecord(targetTabId);

    return { success: true, tabId: targetTabId, openedWithApi };
  }

  return {
    open,
    resolveTargetTabId,
  };
}

async function getPanelStateMap() {
  const result = await chrome.storage.session.get(PANEL_STATE_KEY);
  return result[PANEL_STATE_KEY] || {};
}

async function setPanelState(tabId, isOpen) {
  const stateMap = await getPanelStateMap();
  stateMap[String(tabId)] = Boolean(isOpen);
  await chrome.storage.session.set({ [PANEL_STATE_KEY]: stateMap });
}

async function getPanelState(tabId) {
  const stateMap = await getPanelStateMap();
  return Boolean(stateMap[String(tabId)]);
}

async function closePanel(tabId) {
  if (tabId === undefined || tabId === null) {
    return { success: false, error: 'Missing tab id.' };
  }

  await chrome.sidePanel.setOptions({
    tabId,
    enabled: false,
    path: PANEL_PATH,
  });

  await setPanelState(tabId, false);

  return { success: true, isOpen: false, tabId };
}

async function openPanelFromSenderContext(senderTab) {
  const tabId = senderTab?.id;
  if (tabId === undefined || tabId === null) {
    return { success: false, tabId: null, error: 'Missing sender tab id.' };
  }

  const windowId = senderTab?.windowId;

  // Preserve gesture-sensitive open path by avoiding awaits before open.
  const setOptionsPromise = chrome.sidePanel.setOptions({
    tabId,
    enabled: true,
    path: PANEL_PATH,
  });

  try {
    if (windowId !== undefined && windowId !== null) {
      await chrome.sidePanel.open({ windowId });
    } else {
      await chrome.sidePanel.open({ tabId });
    }

    await setOptionsPromise;
    return { success: true, tabId, openedWithApi: true };
  } catch (error) {
    try {
      await setOptionsPromise;
    } catch {
      // Ignore setOptions failures here and return the open error.
    }

    return {
      success: false,
      tabId,
      error: error?.message || 'Side panel open failed from sender context.',
    };
  }
}

const sidePanelController = createSidePanelController({
  resolveActiveTabId: async () => {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    return tabs[0]?.id;
  },
  resolveWindowIdForTab: async tabId => {
    if (tabId === undefined || tabId === null) {
      return undefined;
    }

    const tab = await chrome.tabs.get(tabId);
    return tab?.windowId;
  },
  setSidePanelOptions: options => chrome.sidePanel.setOptions(options),
  openSidePanel: options => chrome.sidePanel.open(options),
  storageSet: value => chrome.storage.session.set(value),
});

chrome.runtime.onInstalled.addListener(async () => {
  if (chrome.sidePanel?.setPanelBehavior) {
    await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });
  }
});

chrome.action.onClicked.addListener(async tab => {
  if (!tab?.id) {
    return;
  }

  const currentlyOpen = await getPanelState(tab.id);

  if (currentlyOpen) {
    await closePanel(tab.id);
    return;
  }

  const result = await sidePanelController.open(tab.id);
  if (result.success) {
    await setPanelState(tab.id, true);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const senderTabId = sender.tab?.id;

  (async () => {
    switch (message.type) {
      case 'GET_PANEL_STATE': {
        const targetTabId = getTabIdFromCandidate(message.tabId) ?? senderTabId;
        const isOpen = targetTabId ? await getPanelState(targetTabId) : false;
        sendResponse({ success: true, isOpen, tabId: targetTabId ?? null });
        return;
      }

      case 'TOGGLE_SIDE_PANEL': {
        const targetTabId = getTabIdFromCandidate(message.tabId) ?? senderTabId;

        if (!targetTabId) {
          sendResponse({ success: false, error: 'Missing tab id.' });
          return;
        }

        const shouldOpen = typeof message.open === 'boolean'
          ? message.open
          : !(await getPanelState(targetTabId));

        if (shouldOpen) {
          const result = (
            sender.tab?.id === targetTabId
              ? await openPanelFromSenderContext(sender.tab)
              : await sidePanelController.open(targetTabId)
          );

          if (!result.success) {
            sendResponse({ success: false, error: result.error || 'Open failed.' });
            return;
          }

          await setPanelState(targetTabId, true);
          sendResponse({ success: true, isOpen: true, tabId: targetTabId });
          return;
        }

        const closed = await closePanel(targetTabId);
        sendResponse(closed);
        return;
      }

      case 'OPEN_SIDE_PANEL':
      case SIDE_PANEL_MESSAGE_TYPES.OPEN: {
        const targetTabId = getTabIdFromCandidate(message.tabId) ?? senderTabId;
        const result = (
          sender.tab?.id === targetTabId
            ? await openPanelFromSenderContext(sender.tab)
            : await sidePanelController.open(targetTabId)
        );

        if (result.success) {
          await setPanelState(result.tabId, true);
          sendResponse({ success: true, isOpen: true, tabId: result.tabId });
          return;
        }

        sendResponse({ success: false, error: result.error || 'Open failed.' });
        return;
      }

      case 'CLOSE_SIDE_PANEL':
      case SIDE_PANEL_MESSAGE_TYPES.CLOSE: {
        const targetTabId = getTabIdFromCandidate(message.tabId) ?? senderTabId;
        const result = await closePanel(targetTabId);
        sendResponse(result);
        return;
      }

      default:
        sendResponse({ success: false, error: 'Unknown message type.' });
    }
  })().catch(error => {
    sendResponse({ success: false, error: error.message });
  });

  return true;
});
