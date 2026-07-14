# Launcher SidePanel Demo

Simple MV3 extension demo that injects a launcher button in every page.

- `Open Launcher` enables and opens the side panel.
- `Close Launcher` disables the side panel for the current tab.

Main files:

- `background.js`: copied sidepanel controller logic + tab state handling.
- `launcher-lib.js`: copied launcher helper logic (no external import).
- `content.js`: injects and toggles the launcher button.
- `sidepanel.html` and `sidepanel.js`: minimal side panel UI with a close button.
