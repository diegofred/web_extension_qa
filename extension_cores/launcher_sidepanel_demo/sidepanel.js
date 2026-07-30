async function getActiveTabId() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0]?.id;
}

let hasSentPanelClosed = false;

async function notifyPanelClosed() {
  if (hasSentPanelClosed) {
    return;
  }

  hasSentPanelClosed = true;

  let tabId;
  try {
    tabId = await getActiveTabId();
  } catch {
    tabId = undefined;
  }

  try {
    await chrome.runtime.sendMessage({
      type: 'PANEL_UI_CLOSED',
      tabId,
    });
  } catch {
    // Ignore teardown-time messaging failures.
  }
}

document.getElementById('close-panel').addEventListener('click', async () => {
  const status = document.getElementById('status');
  const tabId = await getActiveTabId();

  const result = await chrome.runtime.sendMessage({
    type: 'CLOSE_SIDE_PANEL',
    tabId,
  });

  if (result && result.success) {
    status.textContent = 'Panel disabled for this tab';
    return;
  }

  status.textContent = 'Could not close panel';
});

window.addEventListener('pagehide', () => {
  void notifyPanelClosed();
});
