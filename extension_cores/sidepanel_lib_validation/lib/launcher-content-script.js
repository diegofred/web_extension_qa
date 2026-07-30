import { SIDE_PANEL_MESSAGE_TYPES } from './sidepanel-controller.js';

export const DEFAULT_LAUNCHER_ID = 'sidepanel-launcher-button';

const DEFAULT_BUTTON_LABEL = 'Launcher';
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

export function createLauncherOpenHandler({ sendRuntimeMessage, getUrl = () => window.location.href, getLocation } = {}) {
  assertFunction('sendRuntimeMessage', sendRuntimeMessage);

  return async function openPanel() {
    const url = getUrl();

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

export function createSidePanelLauncher(adapters, options = {}) {
  const {
    documentRef = document,
    resolveMountNode = () => documentRef.body,
    sendRuntimeMessage,
  } = adapters;

  assertFunction('resolveMountNode', resolveMountNode);
  assertFunction('sendRuntimeMessage', sendRuntimeMessage);

  const {
    id = DEFAULT_LAUNCHER_ID,
    label = DEFAULT_BUTTON_LABEL,
    title = 'Open side panel',
    buttonStyle = DEFAULT_BUTTON_STYLE,
    className = '',
    onBeforeOpen,
    onAfterOpen,
  } = options;

  let buttonElement = null;

  const openPanel = createLauncherOpenHandler({
    sendRuntimeMessage,
    getLocation: () => 'launcher',
  });

  async function handleClick(event) {
    if (typeof onBeforeOpen === 'function') {
      await onBeforeOpen(event);
    }

    await openPanel();

    if (typeof onAfterOpen === 'function') {
      await onAfterOpen(event);
    }
  }

  function createButton() {
    const button = documentRef.createElement('button');

    button.type = 'button';
    button.id = id;
    button.textContent = label;
    button.title = title;
    button.setAttribute('aria-label', title);

    if (className) {
      button.className = className;
    }

    applyStyle(button, buttonStyle);
    button.addEventListener('click', event => {
      void handleClick(event);
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
    if (!buttonElement) {
      buttonElement = documentRef.getElementById(id);
    }

    if (buttonElement?.parentNode) {
      buttonElement.parentNode.removeChild(buttonElement);
    }

    buttonElement = null;
  }

  return {
    id,
    install,
    uninstall,
    openPanel,
    getButtonElement() {
      return buttonElement ?? documentRef.getElementById(id);
    },
  };
}