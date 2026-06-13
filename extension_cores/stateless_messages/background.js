chrome.runtime.onInstalled.addListener(async () => {

  await chrome.sidePanel.setPanelBehavior({
    openPanelOnActionClick: true
  });

});

(async () => {

  await chrome.sidePanel.setPanelBehavior({
    openPanelOnActionClick: true
  });

})();

async function saveSession(tabId, url) {

  await chrome.storage.session.set({
    [`tab:${tabId}`]: {
      tabId,
      sessionId: `tab:${tabId}`,
      url,
      updatedAt: Date.now()
    }
  });

}

chrome.runtime.onMessage.addListener(
  async (message, sender, sendResponse) => {

    switch (message.type) {

      case "REGISTER_TAB": {

        const tabId =
          sender.tab?.id;

        if (!tabId) {
          sendResponse({
            success: false
          });
          return true;
        }

        await saveSession(
          tabId,
          sender.tab?.url
        );

        sendResponse({
          success: true,
          sessionId:
            `tab:${tabId}`
        });

        return true;
      }

      case "CONTENT_TO_PANEL": {

        const queueKey =
          `queue:${message.sessionId}`;

        const result =
          await chrome.storage.session.get(
            queueKey
          );

        const queue =
          result[queueKey] || [];

        queue.push({
          ts: Date.now(),
          payload: message.payload
        });

        await chrome.storage.session.set({
          [queueKey]: queue
        });

        chrome.runtime.sendMessage({
          type: "QUEUE_UPDATED",
          sessionId:
            message.sessionId
        });

        sendResponse({
          success: true
        });

        return true;
      }

      case "LOAD_QUEUE": {

        const queueKey =
          `queue:${message.sessionId}`;

        const result =
          await chrome.storage.session.get(
            queueKey
          );

        sendResponse({
          queue:
            result[queueKey] || []
        });

        return true;
      }

      case "PANEL_TO_CONTENT": {

        await chrome.tabs.sendMessage(
          message.tabId,
          {
            type:
              "PANEL_TO_CONTENT",
            payload:
              message.payload
          }
        );

        sendResponse({
          success: true
        });

        return true;
      }

      case "OPEN_SIDE_PANEL": {
        if (chrome.sidePanel?.open) {
          await chrome.sidePanel.open();
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false, error: 'chrome.sidePanel.open not available' });
        }
        return true;
      }

      default:
        return true;
    }

  }
);