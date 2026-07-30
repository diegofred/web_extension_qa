export const SIDE_PANEL_MESSAGE_TYPES = Object.freeze({
  OPEN: 'open_side_panel',
  CLOSE: 'close_side_panel',
  UPDATE_URL: 'update_side_panel_url',
  UPDATE_FOR_APOLLO: 'update_side_panel_for_apollo',
  UPDATE_IFRAME: 'UPDATE_SIDE_PANEL_IFRAME',
  UPDATE_STATE: 'UPDATE_STATE_ON_SIDEBAR',
  CHECK_VISIBLE: 'CHECK_SIDE_PANEL_VISIBLE',
});

export const SIDE_PANEL_STORAGE_KEYS = Object.freeze({
  OPEN: 'side_panel_open',
  PENDING_OPEN: 'pendingSidePanelOpenRequestTimestamp',
});

export const DEFAULT_SIDE_PANEL_PATH = '/6whwx_rNdM_side-panelz3zbm.html';
export const DEFAULT_OPEN_TTL_MS = 500;
export const DEFAULT_HEARTBEAT_MS = 300;
export const DEFAULT_PER_TAB_STORAGE = false;
export const DEFAULT_TAB_STATE_STORAGE_KEY = 'side_panel_tab_state_map';
export const DEFAULT_NO_IMPLICIT_REBIND = true;

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

export function shouldCloseSidePanel(message, currentTabId) {
  if (!message || message.type !== SIDE_PANEL_MESSAGE_TYPES.CLOSE) {
    return false;
  }

  const messageTabId = getTabIdFromCandidate(message);

  return Boolean(
    message.force ||
      messageTabId === currentTabId ||
      getTabIdFromCandidate(message.tab) === currentTabId,
  );
}

export function createSidePanelController(adapters, options = {}) {
  const {
    resolveActiveTabId,
    setSidePanelOptions,
    openSidePanel,
    sendRuntimeMessage,
    storageGet,
    storageSet,
    now = () => Date.now(),
  } = adapters;

  assertAdapter('resolveActiveTabId', resolveActiveTabId);
  assertAdapter('setSidePanelOptions', setSidePanelOptions);
  assertAdapter('openSidePanel', openSidePanel);
  assertAdapter('sendRuntimeMessage', sendRuntimeMessage);
  assertAdapter('storageGet', storageGet);
  assertAdapter('storageSet', storageSet);

  const {
    panelPath = DEFAULT_SIDE_PANEL_PATH,
    storageKey = SIDE_PANEL_STORAGE_KEYS.OPEN,
    openTtlMs = DEFAULT_OPEN_TTL_MS,
    heartbeatMs = DEFAULT_HEARTBEAT_MS,
    ignoreTabMatching = false,
    perTabStorage = DEFAULT_PER_TAB_STORAGE,
  } = options;

  function resolveStorageKey(tabId) {
    if (!perTabStorage) {
      return storageKey;
    }

    const resolvedTabId = getTabIdFromCandidate(tabId);
    if (resolvedTabId === undefined || resolvedTabId === null) {
      return storageKey;
    }

    return `${storageKey}:${resolvedTabId}`;
  }

  async function resolveTargetTabId(tabId) {
    const resolvedTabId = getTabIdFromCandidate(tabId);
    if (resolvedTabId !== undefined && resolvedTabId !== null) {
      return resolvedTabId;
    }

    return resolveActiveTabId();
  }

  async function setOpenRecord(tabId, timestamp = now()) {
    const resolvedStorageKey = resolveStorageKey(tabId);

    await storageSet({
      [resolvedStorageKey]: {
        timestamp,
        tabId,
      },
    });
  }

  async function open(tabId) {
    const explicitTabId = getTabIdFromCandidate(tabId);
    const targetTabId = explicitTabId ?? await resolveActiveTabId();
    if (targetTabId === undefined || targetTabId === null) {
      return { success: false, tabId: null };
    }

    // Start setOptions first, but do not await it before openSidePanel.
    // This keeps openSidePanel invocation closer to the original user gesture path.
    const setOptionsPromise = setSidePanelOptions({
      tabId: targetTabId,
      enabled: true,
      path: panelPath,
    });

    await openSidePanel({ tabId: targetTabId });
    await setOptionsPromise;
    await setOpenRecord(targetTabId);

    return { success: true, tabId: targetTabId };
  }

  async function close(tabId, force = false) {
    const targetTabId = await resolveTargetTabId(tabId);

    await sendRuntimeMessage({
      type: SIDE_PANEL_MESSAGE_TYPES.CLOSE,
      tabId: targetTabId ?? undefined,
      force,
    });

    return { success: true, tabId: targetTabId ?? null };
  }

  async function isRecentlyOpened(tabId) {
    const resolvedStorageKey = resolveStorageKey(tabId);
    const record = (await storageGet(resolvedStorageKey))?.[resolvedStorageKey];
    if (!record) {
      return false;
    }

    const isFresh = now() - record.timestamp < openTtlMs;
    if (!isFresh) {
      return false;
    }

    if (ignoreTabMatching) {
      return true;
    }

    const targetTabId = getTabIdFromCandidate(tabId);
    return record.tabId === targetTabId;
  }

  function startHeartbeat(tabId) {
    let stopped = false;
    let timerId = null;

    const tick = async () => {
      if (stopped) {
        return;
      }

      try {
        const currentTabId = getTabIdFromCandidate(tabId);
        if (currentTabId === undefined || currentTabId === null) {
          return;
        }

        await setOpenRecord(currentTabId);
      } catch {
        // Best-effort only. The caller can keep using the controller even if storage is unavailable.
      }
    };

    timerId = setInterval(() => {
      void tick();
    }, heartbeatMs);

    void tick();

    return () => {
      stopped = true;
      if (timerId !== null) {
        clearInterval(timerId);
      }
    };
  }

  return {
    panelPath,
    storageKey,
    perTabStorage,
    resolveTargetTabId,
    resolveStorageKey,
    open,
    close,
    setOpenRecord,
    isRecentlyOpened,
    startHeartbeat,
  };
}

function normalizeTabStateMap(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return value;
}

function toTabStateKey(tabId) {
  const resolvedTabId = getTabIdFromCandidate(tabId);
  if (resolvedTabId === undefined || resolvedTabId === null) {
    return null;
  }

  return String(resolvedTabId);
}

export function createStrictPerTabSidePanelController(adapters, options = {}) {
  const { storageGet, storageSet, setSidePanelOptions } = adapters;

  assertAdapter('storageGet', storageGet);
  assertAdapter('storageSet', storageSet);
  assertAdapter('setSidePanelOptions', setSidePanelOptions);

  const {
    tabStateStorageKey = DEFAULT_TAB_STATE_STORAGE_KEY,
    noImplicitRebind = DEFAULT_NO_IMPLICIT_REBIND,
    panelPath = DEFAULT_SIDE_PANEL_PATH,
  } = options;

  const baseController = createSidePanelController(adapters, {
    ...options,
    panelPath,
    perTabStorage: true,
    ignoreTabMatching: false,
  });

  async function getTabStateMap() {
    const result = await storageGet(tabStateStorageKey);
    return normalizeTabStateMap(result?.[tabStateStorageKey]);
  }

  async function setTabOpenState(tabId, isOpen) {
    const key = toTabStateKey(tabId);
    if (key === null) {
      return { success: false, tabId: null, isOpen: Boolean(isOpen) };
    }

    const stateMap = await getTabStateMap();
    stateMap[key] = Boolean(isOpen);

    await storageSet({
      [tabStateStorageKey]: stateMap,
    });

    return { success: true, tabId: getTabIdFromCandidate(tabId), isOpen: Boolean(isOpen) };
  }

  async function isTabOpen(tabId) {
    const key = toTabStateKey(tabId);
    if (key === null) {
      return false;
    }

    const stateMap = await getTabStateMap();
    return Boolean(stateMap[key]);
  }

  async function syncTabActivation(tabId) {
    const targetTabId = await baseController.resolveTargetTabId(tabId);
    if (targetTabId === undefined || targetTabId === null) {
      return { success: false, tabId: null, enabled: false };
    }

    const enabled = await isTabOpen(targetTabId);
    await setSidePanelOptions({
      tabId: targetTabId,
      enabled,
      path: panelPath,
    });

    return { success: true, tabId: targetTabId, enabled };
  }

  function shouldProcessTabUpdate(eventTabId, activeTabId) {
    if (!noImplicitRebind) {
      return true;
    }

    return getTabIdFromCandidate(eventTabId) === getTabIdFromCandidate(activeTabId);
  }

  async function open(tabId) {
    const result = await baseController.open(tabId);
    if (result.success && result.tabId !== undefined && result.tabId !== null) {
      await setTabOpenState(result.tabId, true);
    }

    return result;
  }

  async function close(tabId, force = false) {
    const targetTabId = await baseController.resolveTargetTabId(tabId);
    const result = await baseController.close(targetTabId, force);

    if (targetTabId !== undefined && targetTabId !== null) {
      await setTabOpenState(targetTabId, false);
      await setSidePanelOptions({
        tabId: targetTabId,
        enabled: false,
        path: panelPath,
      });
    }

    return result;
  }

  return {
    ...baseController,
    noImplicitRebind,
    tabStateStorageKey,
    open,
    close,
    getTabStateMap,
    setTabOpenState,
    isTabOpen,
    syncTabActivation,
    shouldProcessTabUpdate,
  };
}

export function createSidePanelVisibilityGuard({ getCurrentTabId, getIframeElement, closeWindow } = {}) {
  assertAdapter('getCurrentTabId', getCurrentTabId);
  assertAdapter('getIframeElement', getIframeElement);
  assertAdapter('closeWindow', closeWindow);

  return {
    shouldClose(message, senderTabId) {
      const currentTabId = senderTabId ?? getCurrentTabId();
      return shouldCloseSidePanel(message, currentTabId);
    },
    getVisibleSize() {
      const iframeElement = getIframeElement();
      if (!iframeElement) {
        return { width: 0, height: 0 };
      }

      return {
        width: iframeElement.offsetWidth ?? 0,
        height: iframeElement.offsetHeight ?? 0,
      };
    },
    closeIfRequested(message, senderTabId) {
      if (this.shouldClose(message, senderTabId)) {
        closeWindow();
        return true;
      }

      return false;
    },
  };
}