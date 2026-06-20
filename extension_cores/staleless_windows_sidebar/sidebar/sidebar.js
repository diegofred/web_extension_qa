const searchParams = new URLSearchParams(window.location.search);
const tabId = Number(searchParams.get("tabId"));

let port = null;

function appendMessage(payload) {
  const node = document.createElement("div");
  node.className = "message-item";
  node.textContent = JSON.stringify(payload, null, 2);

  const messages = document.getElementById("messages");
  messages.prepend(node);
}

function currentPayload() {
  const input = document.getElementById("message");
  return {
    message: input.value.trim() || "Hello from popup sidebar",
    timestamp: new Date().toISOString(),
    source: "popup-sidebar"
  };
}

async function sendToContent() {
  if (!tabId || Number.isNaN(tabId)) {
    appendMessage({ error: "Missing tabId in sidebar URL" });
    return;
  }

  const payload = currentPayload();

  const response = await chrome.runtime.sendMessage({
    type: "SIDEBAR_TO_CONTENT",
    tabId,
    payload
  });

  appendMessage({
    direction: "sidebar->content",
    delivered: Boolean(response?.ok),
    payload
  });
}

window.addEventListener("message", (event) => {
  if (event.data?.type !== "CONNECT") {
    return;
  }

  port = event.ports?.[0] ?? null;

  if (!port) {
    return;
  }

  port.onmessage = (channelEvent) => {
    appendMessage({
      direction: "content->sidebar",
      payload: channelEvent.data
    });
  };
});

function wireUI() {
  const context = document.getElementById("context");
  context.textContent = Number.isNaN(tabId)
    ? "Connected to tab: unknown"
    : `Connected to tab: ${tabId}`;

  document.getElementById("send").addEventListener("click", () => {
    sendToContent().catch((error) => {
      appendMessage({
        error: error?.message || "Unknown send error"
      });
    });
  });

  document.getElementById("close").addEventListener("click", () => {
    if (port) {
      port.postMessage({ type: "CLOSE_PANEL" });
      return;
    }

    window.close();
  });
}

wireUI();
