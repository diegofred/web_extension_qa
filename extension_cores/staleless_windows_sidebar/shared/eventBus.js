(function () {

  const listeners = {};

  function on(eventName, callback) {

    if (!listeners[eventName]) {
      listeners[eventName] = [];
    }

    listeners[eventName].push(callback);
  }

  function emit(eventName, payload) {

    window.postMessage(
      {
        source: "__assistant_bus__",
        event: eventName,
        payload
      },
      "*"
    );
  }

  window.addEventListener(
    "message",
    (event) => {

      if (
        event.data?.source !==
        "__assistant_bus__"
      ) {
        return;
      }

      const callbacks =
        listeners[
          event.data.event
        ] || [];

      callbacks.forEach(
        (callback) => {
          callback(
            event.data.payload
          );
        }
      );
    }
  );

  window.AssistantBus = {
    emit,
    on
  };

})();