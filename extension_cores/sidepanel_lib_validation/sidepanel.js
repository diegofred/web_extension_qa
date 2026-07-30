async function getActiveTabId() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab?.id ?? null;
}

async function refreshState() {
  const tabId = await getActiveTabId();

  const activeTabNode = document.getElementById('active-tab');
  const openStateNode = document.getElementById('open-state');
  const debugNode = document.getElementById('debug-output');

  if (tabId === null) {
    activeTabNode.textContent = 'Active tab: unavailable';
    openStateNode.textContent = 'Open state: false';
    debugNode.textContent = '{}';
    return;
  }

  activeTabNode.textContent = `Active tab: ${tabId}`;

  const tabStateResponse = await chrome.runtime.sendMessage({
    type: 'GET_TAB_PANEL_STATE',
    tabId,
  });

  openStateNode.textContent = `Open state: ${tabStateResponse?.open ? 'true' : 'false'}`;

  const debugStateResponse = await chrome.runtime.sendMessage({ type: 'DEBUG_GET_ALL_STATES' });
  debugNode.textContent = JSON.stringify(debugStateResponse, null, 2);
}

document.getElementById('refresh')?.addEventListener('click', () => {
  void refreshState();
});

void refreshState();
