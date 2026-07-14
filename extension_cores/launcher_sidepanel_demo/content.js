async function safeSendMessage(message) {
  try {
    return await chrome.runtime.sendMessage(message);
  } catch {
    return { success: false };
  }
}

function setLauncherLabel(button, isOpen) {
  button.textContent = isOpen ? 'Close Launcher' : 'Open Launcher';
  button.setAttribute('aria-label', button.textContent);
  button.title = button.textContent;
}

async function getInitialState() {
  const response = await safeSendMessage({ type: 'GET_PANEL_STATE' });
  return Boolean(response && response.success && response.isOpen);
}

async function initLauncher() {
  const initialState = await getInitialState();

  const launcher = globalThis.SidePanelLauncherLib.createSidePanelLauncher(
    {
      sendRuntimeMessage: message => chrome.runtime.sendMessage(message),
    },
    {
      id: 'launcher-sidepanel-button',
      label: initialState ? 'Close Launcher' : 'Open Launcher',
      title: 'Toggle Side Panel',
      testId: 'launcher-toggle',
      onClick: async (_event, context) => {
        const button = context.button;
        const currentlyOpen = button.textContent.includes('Close');
        const optimisticNext = !currentlyOpen;

        // Immediate UX feedback for the launcher click.
        setLauncherLabel(button, optimisticNext);

        const response = await safeSendMessage({
          type: 'TOGGLE_SIDE_PANEL',
          open: optimisticNext,
        });

        if (response && response.success) {
          setLauncherLabel(button, Boolean(response.isOpen));
          return;
        }

        // Revert when opening/closing fails so UI state matches reality.
        setLauncherLabel(button, currentlyOpen);
      },
    },
  );

  const button = launcher.install();
  setLauncherLabel(button, initialState);
}

if (document.body) {
  void initLauncher();
} else {
  window.addEventListener('DOMContentLoaded', () => {
    void initLauncher();
  }, { once: true });
}
