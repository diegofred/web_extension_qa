chrome.runtime.onMessage.addListener(
  (message, sender, sendResponse) => {

    if (
      message.type ===
      "GET_TAB_CONTEXT"
    ) {

      sendResponse({
        tabId:
          sender.tab?.id
      });

      return true;
    }

  }
);