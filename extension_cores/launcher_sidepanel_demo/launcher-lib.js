(function () {
  const SIDE_PANEL_MESSAGE_TYPES = Object.freeze({
    OPEN: 'open_side_panel',
  });

  const DEFAULT_LAUNCHER_ID = 'sidepanel-launcher-button';

  const DEFAULT_BUTTON_STYLE = Object.freeze({
    position: 'fixed',
    right: '16px',
    bottom: '16px',
    zIndex: '2147483647',
    border: 'none',
    borderRadius: '999px',
    padding: '12px 18px',
    background: '#111111',
    color: '#ffffff',
    fontFamily: 'system-ui, sans-serif',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.18)',
  });

  function assertFunction(name, value) {
    if (typeof value !== 'function') {
      throw new TypeError(`Missing required launcher adapter: ${name}`);
    }
  }

  function applyStyle(element, styleObject) {
    Object.entries(styleObject).forEach(([property, value]) => {
      element.style[property] = value;
    });
  }

  function createLauncherOpenHandler({ sendRuntimeMessage, getUrl, getLocation }) {
    assertFunction('sendRuntimeMessage', sendRuntimeMessage);

    return async function openPanel() {
      const url = typeof getUrl === 'function' ? getUrl() : globalThis.location.href;

      if (url) {
        await sendRuntimeMessage({
          type: 'update_url',
          payload: url,
        });
      }

      await sendRuntimeMessage({
        type: SIDE_PANEL_MESSAGE_TYPES.OPEN,
        location: typeof getLocation === 'function' ? getLocation() : 'launcher',
      });
    };
  }

  function createSidePanelLauncher(adapters, options) {
    const mergedOptions = options || {};
    const documentRef = (adapters && adapters.documentRef) || document;
    const resolveMountNode = (adapters && adapters.resolveMountNode) || (() => documentRef.body);
    const sendRuntimeMessage = adapters && adapters.sendRuntimeMessage;

    assertFunction('resolveMountNode', resolveMountNode);
    assertFunction('sendRuntimeMessage', sendRuntimeMessage);

    const id = mergedOptions.id || DEFAULT_LAUNCHER_ID;
    const label = mergedOptions.label || 'Launcher';
    const title = mergedOptions.title || 'Open side panel';
    const buttonStyle = mergedOptions.buttonStyle || DEFAULT_BUTTON_STYLE;
    const className = mergedOptions.className || '';
    const testId = mergedOptions.testId || 'launcher-toggle';

    let buttonElement = null;

    const openPanel = createLauncherOpenHandler({
      sendRuntimeMessage,
      getLocation: () => 'launcher',
    });

    function createButton() {
      const button = documentRef.createElement('button');

      button.type = 'button';
      button.id = id;
      button.textContent = label;
      button.title = title;
      button.setAttribute('aria-label', title);
      button.setAttribute('data-testid', testId);

      if (className) {
        button.className = className;
      }

      applyStyle(button, buttonStyle);

      button.addEventListener('click', event => {
        if (typeof mergedOptions.onClick === 'function') {
          void mergedOptions.onClick(event, { button, openPanel });
          return;
        }

        void openPanel();
      });

      return button;
    }

    function install() {
      const existingButton = documentRef.getElementById(id);
      if (existingButton) {
        buttonElement = existingButton;
        return existingButton;
      }

      const mountNode = resolveMountNode();
      if (!mountNode) {
        throw new Error('Could not resolve a mount node for the launcher button.');
      }

      buttonElement = createButton();
      mountNode.appendChild(buttonElement);
      return buttonElement;
    }

    function uninstall() {
      const node = buttonElement || documentRef.getElementById(id);
      if (node && node.parentNode) {
        node.parentNode.removeChild(node);
      }
      buttonElement = null;
    }

    return {
      id,
      install,
      uninstall,
      openPanel,
      getButtonElement: function () {
        return buttonElement || documentRef.getElementById(id);
      },
    };
  }

  globalThis.SidePanelLauncherLib = {
    createLauncherOpenHandler,
    createSidePanelLauncher,
  };
})();
