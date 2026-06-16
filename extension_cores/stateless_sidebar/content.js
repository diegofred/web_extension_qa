let button;

async function updateButton() {

  const response =
    await chrome.runtime.sendMessage({
      type:
        "GET_PANEL_STATE"
    });

  button.innerText =
    response.desiredOpen
      ? "Hide Panel"
      : "Show Panel";
}

async function togglePanel() {

  const response =
    await chrome.runtime.sendMessage({
      type:
        "TOGGLE_PANEL"
    });

  button.innerText =
    response.desiredOpen
      ? "Hide Panel"
      : "Show Panel";
}

function createButton() {

  button =
    document.createElement(
      "button"
    );

  button.style.position =
    "fixed";

  button.style.top =
    "20px";

  button.style.right =
    "20px";

  button.style.zIndex =
    "999999";

  button.onclick =
    togglePanel;

  document.body.appendChild(
    button
  );

  updateButton();
}

createButton();