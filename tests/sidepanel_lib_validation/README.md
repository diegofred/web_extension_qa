# Sidepanel Lib Validation Test

Run this Playwright integration test to validate strict per-tab behavior.

## Run

From `web_extension_qa/tests`:

```bash
node sidepanel_lib_validation/playwright-sidepanel-lib-validation.spec.js
```

## Assertions

- Tab A opens sidepanel and is marked open in persisted tab state map.
- Tab B activation applies `enabled: false` via activation sync map.
- Switching back to Tab A applies `enabled: true` again.
