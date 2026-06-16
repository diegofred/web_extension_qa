# Test Case

## Title

Sidebar Toggle - Button Opens Panel State

---

## User Story

As a leasing agent,

when I click the injected sidebar toggle button,

I want the extension to switch from closed to open state,

so that I can immediately use the sidepanel.

---

## PMS Fixture

generic/local-fixture.html

---

## Mocked APIs

None

---

## Preconditions

Extension loaded from `extension_cores/stateless_sidebar`

A local fixture page is open

Sidepanel page is open in extension context

---

## Steps

1. Open local fixture page
2. Validate button initially shows `Show Panel`
3. Open sidepanel page
4. Click `Show Panel`
5. Wait for UI state sync

---

## Expected Results

* Page button changes to `Hide Panel`
* Sidepanel open section is visible
* Sidepanel closed section is hidden
* No console errors are emitted

---

## Assertions

* `assertTextContains(page, 'button', 'Hide Panel')`
* `assertTextContains(sidepanel, 'body', 'Panel is active')`
* `assertNoConsoleErrors(...)`


# Test Case

## Title

Sidebar Toggle - Button Closes Panel State

---

## User Story

As a leasing agent,

when I click the toggle button again,

I want the extension to switch from open to closed state,

so that the panel reflects an inactive state.

---

## PMS Fixture

generic/local-fixture.html

---

## Mocked APIs

None

---

## Preconditions

Panel state is currently open for active tab

Button currently shows `Hide Panel`

---

## Steps

1. Click `Hide Panel`
2. Wait for sidepanel state update

---

## Expected Results

* Page button changes to `Show Panel`
* Sidepanel closed section is visible
* Sidepanel open section is hidden
* No console errors are emitted

---

## Assertions

* `assertTextContains(page, 'button', 'Show Panel')`
* `assertTextContains(sidepanel, 'body', 'Panel Hidden')`
* `assertNoConsoleErrors(...)`


# Test Case

## Title

Sidebar Toggle - Rapid Sequential Clicks Keep Last Intent

---

## User Story

As a leasing agent,

when I click the toggle button quickly multiple times,

I want the final click intent to be preserved,

so that the panel state is deterministic.

---

## PMS Fixture

generic/local-fixture.html

---

## Mocked APIs

None

---

## Preconditions

Extension loaded

Button rendered by content script

---

## Steps

1. Perform 5 rapid button clicks
2. Wait briefly for async runtime messaging
3. Read final button text
4. Validate sidepanel content

---

## Expected Results

* Final state reflects odd number of toggles (`Hide Panel`)
* Sidepanel reports open content
* No runtime failures or console errors

---

## Assertions

* `assertTextContains(page, 'button', 'Hide Panel')`
* `assertTextContains(sidepanel, 'body', 'Panel is active')`
* `assertNoConsoleErrors(...)`


# Test Case

## Title

Sidebar Toggle - State Is Isolated Per Tab

---

## User Story

As a leasing agent working in multiple tabs,

when I toggle panel state in one tab,

I want other tabs to keep their own panel state,

so that actions in one tab do not leak to another.

---

## PMS Fixture

generic/local-fixture.html

---

## Mocked APIs

None

---

## Preconditions

Two fixture tabs are open

Both tabs have injected button

---

## Steps

1. Toggle panel open on Tab A
2. Switch to Tab B
3. Validate Tab B remains closed (`Show Panel`)
4. Toggle Tab B open
5. Switch back to Tab A and validate it remains open

---

## Expected Results

* Tab states remain independent
* Sidepanel displays state according to active tab
* No console errors are emitted

---

## Assertions

* `assertTextContains(tabA, 'button', 'Hide Panel')`
* `assertTextContains(tabB, 'button', 'Show Panel')` before toggle
* `assertNoConsoleErrors(...)`


# Test Case

## Title

Sidebar Toggle - State Persists After Page Reload

---

## User Story

As a leasing agent,

when I reload the current page,

I want the button to recover the latest desired panel state,

so that I do not lose my workflow context.

---

## PMS Fixture

generic/local-fixture.html

---

## Mocked APIs

None

---

## Preconditions

Panel state is open in active tab

---

## Steps

1. Reload the tab
2. Wait for content script to re-initialize
3. Read button state
4. Validate sidepanel state for active tab

---

## Expected Results

* Button restores `Hide Panel`
* Sidepanel remains in open state representation
* No console errors are emitted

---

## Assertions

* `assertTextContains(page, 'button', 'Hide Panel')`
* `assertTextContains(sidepanel, 'body', 'Panel is active')`
* `assertNoConsoleErrors(...)`
