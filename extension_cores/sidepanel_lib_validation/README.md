# Sidepanel Library Validation Core

This extension core validates the extracted sidepanel library behavior with strict per-tab state.

## Goal

Validate this scenario:

1. Open sidepanel in Tab A
2. Switch to Tab B and confirm Tab B is disabled
3. Switch back to Tab A and confirm Tab A remains enabled

The implementation uses `createStrictPerTabSidePanelController` from `lib/sidepanel-controller.js`.

## Files

- `manifest.json`: MV3 extension manifest
- `background.js`: per-tab sidepanel orchestration
- `content.js`: in-page controls to open/close sidepanel for current tab
- `sidepanel.html` and `sidepanel.js`: debug view of current and global tab states
- `lib/sidepanel-controller.js`: extracted library under validation
- `lib/launcher-content-script.js`: copied helper (optional for future flows)

## Manual validation

1. Load this folder as unpacked extension:
   - `web_extension_qa/extension_cores/sidepanel_lib_validation`
2. Open `https://example.com` as Tab A.
3. Click `Open Sidepanel (This Tab)` from the floating content controls.
4. Open another page as Tab B.
5. Confirm sidepanel is not enabled for Tab B.
6. Return to Tab A and confirm sidepanel remains available.

## Debugging

Open sidepanel and click `Refresh State`.

- `Open state` shows whether current active tab is marked open.
- `Debug state map` includes:
  - `tabStateMap`: persisted tab open flags.
  - `activationSyncMap`: last enable/disable result applied during tab activation.
