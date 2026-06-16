let port = null;

window.addEventListener(
  "message",
  (event) => {

    if (
      event.data?.type !==
      "CONNECT"
    ) {
      return;
    }

    port =
      event.ports[0];

    port.onmessage =
      (event) => {

        appendMessage(
          JSON.stringify(
            event.data,
            null,
            2
          )
        );

      };
  }
);

function appendMessage(text) {

  const div =
    document.createElement(
      "div"
    );

  div.textContent =
    text;

  document
    .getElementById(
      "messages"
    )
    .appendChild(div);
}

document
  .getElementById("ping")
  .addEventListener(
    "click",
    () => {

      if (!port)
        return;

      port.postMessage({
        message:
          "Hello from sidebar",
        timestamp:
          Date.now()
      });

    }
  );