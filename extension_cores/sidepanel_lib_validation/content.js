const BUTTON_HOST_ID = 'sidepanel-lib-validation-controls';

function createButton(id, label) {
  const button = document.createElement('button');
  button.id = id;
  button.type = 'button';
  button.textContent = label;
  button.style.border = '1px solid #222';
  button.style.borderRadius = '8px';
  button.style.padding = '8px 12px';
  button.style.background = '#fff';
  button.style.cursor = 'pointer';
  button.style.fontSize = '12px';
  return button;
}

function ensureUi() {
  if (document.getElementById(BUTTON_HOST_ID)) {
    return;
  }

  const host = document.createElement('div');
  host.id = BUTTON_HOST_ID;
  host.style.position = 'fixed';
  host.style.top = '16px';
  host.style.right = '16px';
  host.style.zIndex = '2147483647';
  host.style.display = 'flex';
  host.style.flexDirection = 'column';
  host.style.gap = '8px';
  host.style.padding = '12px';
  host.style.background = 'rgba(255, 255, 255, 0.95)';
  host.style.border = '1px solid #ddd';
  host.style.borderRadius = '10px';
  host.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.12)';
  host.style.fontFamily = 'system-ui, sans-serif';

  const title = document.createElement('div');
  title.textContent = 'Sidepanel Lib Validation';
  title.style.fontSize = '12px';
  title.style.fontWeight = '700';

  const openButton = createButton('rb-open-sidepanel', 'Open Sidepanel (This Tab)');
  const closeButton = createButton('rb-close-sidepanel', 'Close Sidepanel (This Tab)');

  const status = document.createElement('div');
  status.id = 'rb-sidepanel-status';
  status.style.fontSize = '12px';
  status.style.color = '#333';
  status.textContent = 'Status: idle';

  openButton.addEventListener('click', async () => {
    const response = await chrome.runtime.sendMessage({ type: 'OPEN_SIDE_PANEL_FOR_TAB' });
    status.textContent = response?.success ? `Status: open on tab ${response.tabId}` : `Status: error (${response?.reason || 'unknown'})`;
  });

  closeButton.addEventListener('click', async () => {
    const response = await chrome.runtime.sendMessage({ type: 'CLOSE_SIDE_PANEL_FOR_TAB' });
    status.textContent = response?.success ? `Status: closed on tab ${response.tabId}` : `Status: error (${response?.reason || 'unknown'})`;
  });

  host.appendChild(title);
  host.appendChild(openButton);
  host.appendChild(closeButton);
  host.appendChild(status);
  document.body.appendChild(host);
}

ensureUi();
