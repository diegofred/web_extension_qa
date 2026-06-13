let tabId = null;
let sessionId = null;

async function discoverContext() {

  const [tab] =
    await chrome.tabs.query({
      active: true,
      currentWindow: true
    });

  if (!tab) {

    document
      .getElementById("title")
      .innerText =
      "No active tab";

    return false;
  }

  tabId =
    tab.id;

  sessionId =
    `tab:${tabId}`;

  document
    .getElementById("title")
    .innerText =
    `Tab ${tabId}`;

  return true;
}

async function loadQueue() {

  if (!sessionId)
    return;

  const response =
    await chrome.runtime.sendMessage({
      type: "LOAD_QUEUE",
      sessionId
    });

  const container =
    document.getElementById(
      "messages"
    );

  container.innerHTML = "";

  response.queue.forEach(
    (item) => {

      const div =
        document.createElement(
          "div"
        );

      div.className =
        "msg";

      div.textContent =
        JSON.stringify(
          item.payload,
          null,
          2
        );

      container.appendChild(
        div
      );

    }
  );
}

chrome.runtime.onMessage.addListener(
  async (message) => {

    if (
      message.type !==
      "QUEUE_UPDATED"
    ) {
      return;
    }

    if (
      message.sessionId ===
      sessionId
    ) {
      await loadQueue();
    }

  }
);

document
  .getElementById("refresh")
  .onclick =
  loadQueue;

document
  .getElementById("send")
  .onclick =
  async () => {

    await chrome.runtime.sendMessage({
      type:
        "PANEL_TO_CONTENT",

      tabId,

      payload: {
        message:
          "Hello from SidePanel",

        ts:
          Date.now()
      }
    });

  };

(async () => {

  const ok =
    await discoverContext();

  if (ok) {
    await loadQueue();
  }

})();