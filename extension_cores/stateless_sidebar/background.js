chrome.runtime.onInstalled.addListener(async () => {
  await chrome.sidePanel.setPanelBehavior({
    openPanelOnActionClick: true
  });
});

async function getPanelState(tabId) {
  const key = `panel:${tabId}`;

  const result =
    await chrome.storage.session.get(key);

  return (
    result[key] || {
      desiredOpen: false
    }
  );
}

async function savePanelState(
  tabId,
  state
) {
  await chrome.storage.session.set({
    [`panel:${tabId}`]: state
  });
}

chrome.runtime.onMessage.addListener(
  async (
    message,
    sender,
    sendResponse
  ) => {

    const tabId =
      sender.tab?.id ||
      message.tabId;

    switch (message.type) {

      case "TOGGLE_PANEL": {

        const state =
          await getPanelState(tabId);

        const nextState =
          !state.desiredOpen;

        await savePanelState(
          tabId,
          {
            desiredOpen:
              nextState,
            updatedAt:
              Date.now()
          }
        );

        chrome.runtime.sendMessage({
          type:
            "PANEL_STATE_CHANGED",

          tabId,

          desiredOpen:
            nextState
        });

        sendResponse({
          desiredOpen:
            nextState
        });

        return true;
      }

      case "GET_PANEL_STATE": {

        const state =
          await getPanelState(tabId);

        sendResponse(state);

        return true;
      }

      case "PANEL_HEARTBEAT": {

        await chrome.storage.session.set({
          [`heartbeat:${tabId}`]:
          {
            ts:
              Date.now()
          }
        });

        sendResponse({
          success: true
        });

        return true;
      }
    }

    return true;
  }
);