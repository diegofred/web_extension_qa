const ROOT_ID = "__assistant_root";
const BUTTON_ID = "__assistant_toggle";
const SIDEBAR_ID = "__assistant_sidebar";
const SIDEBAR_WIDTH = 420;
const SIDEBAR_GAP = 12;
const PANEL_TRANSITION = "220ms cubic-bezier(0.2, 0, 0, 1)";

let tabId = null;
let state = { open: false };

let channelPort = null;
let iframeWindow = null;
let hasCapturedPageStyles = false;
let originalHtmlOverflowX = "";
let originalBodyTransition = "";
let originalBodyMarginRight = "";
let originalBodyOverflowX = "";

function storageKey() {
  return `sidebar:${tabId}`;
}

function capturePageStylesIfNeeded() {
  if (hasCapturedPageStyles || !document.body) {
    return;
  }

  hasCapturedPageStyles = true;
  originalHtmlOverflowX = document.documentElement.style.overflowX;
  originalBodyTransition = document.body.style.transition;
  originalBodyMarginRight = document.body.style.marginRight;
  originalBodyOverflowX = document.body.style.overflowX;
}

async function loadContext() {
  const response = await chrome.runtime.sendMessage({
    type: "GET_TAB_CONTEXT"
  });

  tabId = response?.tabId ?? null;
}

async function loadState() {
  const result = await chrome.storage.local.get(storageKey());

  state = result[storageKey()] || {
    open: false
  };
}

async function saveState() {
  await chrome.storage.local.set({
    [storageKey()]: state
  });
}

function createRoot() {
  let root = document.getElementById(ROOT_ID);

  if (root) {
    return root;
  }

  root = document.createElement("div");
  root.id = ROOT_ID;
  root.style.position = "fixed";
  root.style.top = "0";
  root.style.right = "0";
  root.style.height = "100vh";
  root.style.width = `${SIDEBAR_WIDTH}px`;
  root.style.zIndex = "2147483646";
  root.style.display = "block";
  root.style.visibility = "hidden";
  root.style.pointerEvents = "none";
  root.style.transform = "translateX(100%)";
  root.style.transition = `transform ${PANEL_TRANSITION}, visibility 0s linear ${PANEL_TRANSITION}`;
  root.style.background = "#f6f8fa";
  root.style.borderLeft = "1px solid #d8dee4";
  root.style.boxShadow = "-8px 0 24px rgba(15, 23, 42, 0.12)";

  document.documentElement.appendChild(root);
  return root;
}

function connectSidebarChannel() {
  if (!iframeWindow) {
    return;
  }

  const channel = new MessageChannel();
  channelPort = channel.port1;

  channelPort.onmessage = (event) => {
    if (!event?.data) {
      return;
    }

    if (event.data.type === "CLOSE_PANEL") {
      state.open = false;
      saveState().catch(() => undefined);
      render();
      return;
    }

    chrome.runtime.sendMessage({
      type: "SIDEBAR_TO_CONTENT",
      tabId,
      payload: event.data
    }).catch(() => undefined);
  };

  iframeWindow.postMessage(
    { type: "CONNECT" },
    "*",
    [channel.port2]
  );
}

function createSidebar() {
  const root = createRoot();

  if (root.shadowRoot) {
    return;
  }

  const shadow = root.attachShadow({ mode: "open" });
  const iframe = document.createElement("iframe");
  iframe.id = SIDEBAR_ID;
  iframe.src = `${chrome.runtime.getURL("sidebar/sidebar.html")}?tabId=${tabId}`;
  iframe.style.width = "100%";
  iframe.style.height = "100%";
  iframe.style.border = "none";
  iframe.style.background = "#f6f8fa";
  iframe.style.borderLeft = "1px solid #dadce0";

  shadow.appendChild(iframe);

  iframe.addEventListener("load", () => {
    iframeWindow = iframe.contentWindow;
    connectSidebarChannel();
  });
}

function applyPageShift() {
  if (!document.body) {
    return;
  }

  capturePageStylesIfNeeded();

  if (state.open) {
    document.documentElement.style.overflowX = "hidden";
    document.body.style.transition = `margin-right ${PANEL_TRANSITION}`;
    document.body.style.marginRight = `${SIDEBAR_WIDTH}px`;
    document.body.style.overflowX = "hidden";
    return;
  }

  document.documentElement.style.overflowX = originalHtmlOverflowX;
  document.body.style.transition = originalBodyTransition;
  document.body.style.marginRight = originalBodyMarginRight;
  document.body.style.overflowX = originalBodyOverflowX;
}

function destroySidebarRuntime() {
  if (channelPort) {
    channelPort.close();
    channelPort = null;
  }

  iframeWindow = null;
}

function createButton() {
  if (document.getElementById(BUTTON_ID)) {
    return;
  }

  const button = document.createElement("button");
  button.id = BUTTON_ID;

  button.style.position = "fixed";
  button.style.top = "16px";
  button.style.right = "16px";
  button.style.zIndex = "2147483647";
  button.style.height = "36px";
  button.style.minWidth = "132px";
  button.style.border = "1px solid #d0d7de";
  button.style.borderRadius = "999px";
  button.style.background = "#ffffff";
  button.style.color = "#1f2328";
  button.style.fontFamily = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  button.style.fontSize = "13px";
  button.style.fontWeight = "600";
  button.style.boxShadow = "0 1px 3px rgba(15, 23, 42, 0.12)";
  button.style.cursor = "pointer";
  button.style.transition = `right ${PANEL_TRANSITION}`;

  button.onclick = async () => {
    state.open = !state.open;
    await saveState();
    render();
  };

  document.documentElement.appendChild(button);
}

function render() {
  const root = document.getElementById(ROOT_ID);
  const button = document.getElementById(BUTTON_ID);

  if (!button) {
    return;
  }

  if (root) {
    root.style.visibility = state.open ? "visible" : "hidden";
    root.style.pointerEvents = state.open ? "auto" : "none";
    root.style.transform = state.open ? "translateX(0)" : "translateX(100%)";
    root.style.transition = state.open
      ? `transform ${PANEL_TRANSITION}`
      : `transform ${PANEL_TRANSITION}, visibility 0s linear ${PANEL_TRANSITION}`;
  }

  button.style.right = state.open
    ? `${SIDEBAR_WIDTH + SIDEBAR_GAP}px`
    : "16px";

  applyPageShift();

  button.textContent = state.open ? "Hide Side Panel" : "Show Side Panel";
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "SIDEBAR_TO_CONTENT") {
    if (channelPort) {
      channelPort.postMessage(message.payload);
    }
  }
});

window.Assistant = {
  send(message) {
    chrome.runtime.sendMessage({
      type: "SIDEBAR_TO_CONTENT",
      tabId,
      payload: {
        type: "CUSTOM_MESSAGE",
        message
      }
    });
  },

  toggle: async () => {
    state.open = !state.open;
    await saveState();
    render();
  },

  isOpen() {
    return state.open;
  },

  getTabId() {
    return tabId;
  }
};

(async () => {
  await loadContext();
  await loadState();
  createSidebar();
  createButton();
  render();
})();

window.addEventListener("beforeunload", () => {
  destroySidebarRuntime();
  state.open = false;
  applyPageShift();
});
