let tabId = null;

async function discoverTab() {

  const [tab] =
    await chrome.tabs.query({
      active: true,
      currentWindow: true
    });

  tabId =
    tab?.id;
}

async function render() {

  if (!tabId)
    return;

  const state =
    await chrome.runtime.sendMessage({
      type:
        "GET_PANEL_STATE",

      tabId
    });

  const open =
    document.getElementById(
      "open"
    );

  const closed =
    document.getElementById(
      "closed"
    );

  if (state.desiredOpen) {

    open.style.display =
      "block";

    closed.style.display =
      "none";

  } else {

    open.style.display =
      "none";

    closed.style.display =
      "block";
  }
}

chrome.runtime.onMessage.addListener(
  async (message) => {

    if (
      message.type !==
      "PANEL_STATE_CHANGED"
    ) {
      return;
    }

    if (
      message.tabId !==
      tabId
    ) {
      return;
    }

    await render();
  }
);

setInterval(async () => {

  if (!tabId)
    return;

  await chrome.runtime.sendMessage({
    type:
      "PANEL_HEARTBEAT",

    tabId
  });

}, 5000);

(async () => {

  await discoverTab();

  await render();

})();