const ROOT_ID = "__assistant_root";
const BUTTON_ID = "__assistant_toggle";
const SIDEBAR_ID = "__assistant_sidebar";

const SIDEBAR_WIDTH = "420px";

let tabId = null;

let state = {
  open: false
};

let port = null;
let iframeWindow = null;

let lastHeartbeat = Date.now();

function storageKey() {
  return `sidebar:${tabId}`;
}

async function loadContext() {
  const response = await chrome.runtime.sendMessage({
    type: "GET_TAB_CONTEXT"
  });

  tabId = response.tabId;
}

async function loadState() {
  const result = await chrome.storage.session.get(
    storageKey()
  );

  state =
    result[storageKey()] || {
      open: false
    };
}

async function saveState() {
  await chrome.storage.session.set({
    [storageKey()]: state
  });
}

function createRoot() {
  let root =
    document.getElementById(
      ROOT_ID
    );

  if (root) {
    return root;
  }

  root =
    document.createElement(
      "div"
    );

  root.id = ROOT_ID;

  root.style.position =
    "fixed";

  root.style.top = "0";

  root.style.right = "0";

  root.style.zIndex =
    "2147483647";

  document.documentElement.appendChild(
    root
  );

  return root;
}

function connectSidebar() {

  if (!iframeWindow) {
    return;
  }

  console.log(
    "[Content] Connecting sidebar"
  );

  const channel =
    new MessageChannel();

  port =
    channel.port1;

  port.onmessage =
    (event) => {

      if (
        event.data?.type ===
        "HEARTBEAT"
      ) {

        lastHeartbeat =
          Date.now();

        return;
      }

      console.log(
        "[Content] Message from sidebar",
        event.data
      );

      alert(
        JSON.stringify(
          event.data,
          null,
          2
        )
      );
    };

  iframeWindow.postMessage(
    {
      type: "CONNECT"
    },
    "*",
    [channel.port2]
  );
}

function createSidebar() {

  const root =
    createRoot();

  if (root.shadowRoot) {
    return;
  }

  const shadow =
    root.attachShadow({
      mode: "open"
    });

  const iframe =
    document.createElement(
      "iframe"
    );

  iframe.id =
    SIDEBAR_ID;

  iframe.src =
    chrome.runtime.getURL(
      "sidebar/sidebar.html"
    );

  iframe.style.width =
    SIDEBAR_WIDTH;

  iframe.style.height =
    "100vh";

  iframe.style.border =
    "none";

  iframe.style.background =
    "#ffffff";

  iframe.style.display =
    "none";

  shadow.appendChild(
    iframe
  );

  iframe.addEventListener(
    "load",
    () => {

      console.log(
        "[Content] Sidebar loaded"
      );

      iframeWindow =
        iframe.contentWindow;

      connectSidebar();
    }
  );
}

function createButton() {

  if (
    document.getElementById(
      BUTTON_ID
    )
  ) {
    return;
  }

  const button =
    document.createElement(
      "button"
    );

  button.id =
    BUTTON_ID;

  button.style.position =
    "fixed";

  button.style.top =
    "20px";

  button.style.right =
    "20px";

  button.style.zIndex =
    "2147483647";

  button.style.padding =
    "10px";

  button.onclick =
    async () => {

      state.open =
        !state.open;

      await saveState();

      render();

    };

  document.body.appendChild(
    button
  );
}

function render() {

  const root =
    document.getElementById(
      ROOT_ID
    );

  if (
    !root ||
    !root.shadowRoot
  ) {
    return;
  }

  const iframe =
    root.shadowRoot.getElementById(
      SIDEBAR_ID
    );

  if (!iframe) {
    return;
  }

  iframe.style.display =
    state.open
      ? "block"
      : "none";

  const button =
    document.getElementById(
      BUTTON_ID
    );

  if (button) {

    button.textContent =
      state.open
        ? "Hide Assistant"
        : "Show Assistant";
  }
}

function sendToSidebar(payload) {

  if (!port) {

    console.warn(
      "[Content] Sidebar channel unavailable"
    );

    return;
  }

  port.postMessage(payload);
}

window.addEventListener(
  "message",
  (event) => {

    if (
      event.data?.type !==
      "RECONNECT_CHANNEL"
    ) {
      return;
    }

    console.log(
      "[Content] Sidebar requested reconnect"
    );

    connectSidebar();
  }
);

setInterval(() => {

  const seconds =
    Math.floor(
      (
        Date.now() -
        lastHeartbeat
      ) / 1000
    );

  if (seconds > 15) {

    console.warn(
      "[Content] Sidebar heartbeat stale:",
      seconds,
      "seconds"
    );

  }

}, 5000);

window.Assistant = {

  send(message) {

    sendToSidebar({
      type: "CUSTOM_MESSAGE",
      payload: message
    });

  },

  toggle: async () => {

    state.open =
      !state.open;

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

  console.log(
    "[Content] Initializing"
  );

  await loadContext();

  await loadState();

  createSidebar();

  createButton();

  render();

  console.log(
    "[Content] Ready",
    {
      tabId,
      state
    }
  );

})();