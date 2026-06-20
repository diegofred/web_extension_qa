chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_TAB_CONTEXT") {
    sendResponse({
      tabId: sender.tab?.id
    });

    return true;
  }

  if (message.type === "SIDEBAR_TO_CONTENT") {
    chrome.tabs.sendMessage(message.tabId, {
      type: "SIDEBAR_TO_CONTENT",
      payload: message.payload
    }).then(() => {
      sendResponse({ ok: true });
    }).catch(() => {
      sendResponse({ ok: false });
    });

    return true;
  }
});
