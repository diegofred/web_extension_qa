# launcher_sidepanel_demo Playwright tests

This suite follows the project integration-test workflow:

- Arrange: load extension and open a real page.
- Act: click launcher button to open and close panel state.
- Assert: verify human-facing text changes and sidepanel controls exist.

Run it with:

```bash
node tests/launcher_sidepanel_demo/playwright-launcher-sidepanel.spec.js
```

Or run the local suite wrapper:

```bash
node tests/launcher_sidepanel_demo/run-all-tests.js
```
