let sessionId = null;

async function init() {

  const response =
    await chrome.runtime.sendMessage({
      type: "REGISTER_TAB"
    });

  sessionId =
    response.sessionId;

  if (document.body) {
    createButtons();
  } else {
    window.addEventListener(
      "DOMContentLoaded",
      createButtons,
      { once: true }
    );
  }
}

function createButtons() {

  const sendButton =
    document.createElement(
      "button"
    );

  sendButton.innerText =
    "Send To Panel";

  sendButton.style.position =
    "fixed";

  sendButton.style.top =
    "20px";

  sendButton.style.right =
    "20px";

  sendButton.style.zIndex =
    "999999";

  sendButton.onclick =
    async () => {

      await chrome.runtime.sendMessage({
        type:
          "CONTENT_TO_PANEL",

        sessionId,

        payload: {
          message:
            "Hello from content",

          url:
            location.href,

          ts:
            Date.now()
        }
      });

    };

  document.body.appendChild(
    sendButton
  );
}

chrome.runtime.onMessage.addListener(
  (message) => {

    if (
      message.type !==
      "PANEL_TO_CONTENT"
    ) {
      return;
    }

    console.log(
      "FROM PANEL",
      message.payload
    );

    alert(
      JSON.stringify(
        message.payload,
        null,
        2
      )
    );

  }
);

init();

// Test bridge: allows Playwright to send runtime messages without UI interaction
if (typeof document !== 'undefined') {
  document.addEventListener('__sidecarSendMessage', async (event) => {
    const { type, payload, requestId } = event.detail || {};
    const response = await chrome.runtime.sendMessage({
      type,
      sessionId,
      payload
    });
    document.dispatchEvent(new CustomEvent('__sidecarSendMessageResponse', {
      detail: { requestId, response }
    }));
  });
}