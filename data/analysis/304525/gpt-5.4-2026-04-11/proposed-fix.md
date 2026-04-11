# Bug Analysis: Issue #304525

## Understanding the Bug

Running `Check for Updates...` on an up-to-date Insiders build shows a "No Update Available" popup, but pressing Escape does not dismiss it unless the popup is focused first. The maintainer comment says the intended fix is to show a modal dialog again instead of using the tooltip-style UI.

## Git History Analysis

- The parent commit is `4003d390fb8747be92b4e66c280584cf92579d16` from `2026-03-30T17:18:34Z`.
- The initial 24-hour history window already surfaced a directly related change: `1771717f2ae` (`Make sure update tooltip is updated in all windows, not just focused one (#304177)`). That commit only touches `src/vs/workbench/contrib/update/browser/updateTitleBarEntry.ts`, which confirms the current update feedback path runs through the title-bar tooltip.
- Blame and file history on the affected code show the actual regression was introduced a bit earlier:
  - `cfe3b3286e45` (`Update action for the title bar (#300453)`) added `titleBarEnabled` checks in `src/vs/workbench/contrib/update/browser/update.ts`, including an early return in `onUpdateNotAvailable()`. That disables the old modal dialog whenever the title-bar update UI is enabled.
  - `f8932104a7c9` (`Update title bar UI feature work and bug fixes (#301497)`) made `src/vs/workbench/contrib/update/browser/updateTitleBarEntry.ts` auto-show a sticky tooltip for `StateType.Idle` whenever `state.notAvailable` or `state.error` is present.
- The parent version of `UpdateTitleBarEntry.showTooltip()` defaults to `focus = false`, and only the explicit user-triggered path calls `showTooltip(true)`. That matches the symptom exactly: the auto-opened hover is visible, but it is not keyboard-focused, so Escape will not dismiss it until focus is moved into it.

### Time Window Used

- Initial: 24 hours
- Final: 24 hours (no expansion needed)

## Root Cause

When a manual update check completes with no update, the update service returns to `State.Idle(..., notAvailable: true)`. In title-bar mode, `UpdateContribution.onUpdateNotAvailable()` suppresses the legacy modal dialog, while `UpdateTitleBarContribution.onStateChange()` auto-opens a sticky title-bar tooltip for the same `Idle.notAvailable` state. That tooltip is shown without focus, so Escape does not close it unless the user focuses it first.

## Proposed Fix

### Option A: Targeted Fix (Recommended)

**Affected Files:**
- `src/vs/workbench/contrib/update/browser/update.ts`
- `src/vs/workbench/contrib/update/browser/updateTitleBarEntry.ts`

**Changes Required:**

Restore the modal dialog for explicit "no update available" results even when the title-bar update UI is enabled, and stop auto-opening the title-bar tooltip for the `Idle.notAvailable` case. Keep the title-bar tooltip behavior for other states such as update errors.

**Code Sketch:**

```ts
// src/vs/workbench/contrib/update/browser/update.ts
private onUpdateNotAvailable(): void {
	this.dialogService.info(nls.localize('noUpdatesAvailable', "There are currently no updates available."));
}

// src/vs/workbench/contrib/update/browser/updateTitleBarEntry.ts
switch (this.state.type) {
	case StateType.Disabled:
		...
		break;
	case StateType.Idle:
		showTooltip = !!this.state.error;
		break;
}
```

This preserves the new title-bar update entry for actionable and error states, but routes the explicit "you are up to date" result back through the modal dialog that already exists and already behaves correctly with Escape.

### Option B: Comprehensive Fix (Optional)

Introduce a shared UI policy for explicit update results so `UpdateContribution` and `UpdateTitleBarContribution` do not independently choose different surfaces for the same state transition. For example, a small helper or explicit state metadata could decide whether a given result should render as a dialog, notification, or tooltip. This would reduce the chance of future conflicts, but it is more change than this issue needs.

## Confidence Level: High

## Reasoning

- `src/vs/workbench/contrib/update/browser/update.ts` already contains the exact modal dialog behavior the maintainer wants; it is only bypassed because of the title-bar guard.
- `src/vs/workbench/contrib/update/browser/updateTitleBarEntry.ts` is the only code that auto-shows the non-focused sticky hover for the `notAvailable` state.
- The interaction code explains the Escape behavior directly: auto-shown tooltip uses `showTooltip()` with the default `focus = false`, while the keyboard-invoked path uses `showTooltip(true)`.
- The maintainer comment says to "show a modal dialog as before instead of the tooltip," and the targeted fix restores precisely that behavior with minimal scope.