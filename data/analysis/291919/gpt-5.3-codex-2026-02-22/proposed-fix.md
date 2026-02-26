# Bug Analysis: Issue #290863

## Understanding the Bug
Clicking the title-bar unread badge and then the in-progress badge can clear all filters unexpectedly.

Repro from issue:
1. Have unread + in-progress sessions
2. Click unread indicator
3. Click in-progress indicator
4. Result: no filters applied

Issue comments add key context:
- Bug reproduces reliably with **two VS Code windows open**.
- Filters are currently stored at **profile scope**, so window A and window B react to the same storage value.
- The non-active window can detect that its local category count is empty and trigger filter restoration/clear, undoing the active window’s filter.

## Git History Analysis
Relevant file before fix PR parent commit (`df6ff376e270fbfb56c38a93b7f72f823414c0e2`):
- `src/vs/workbench/contrib/chat/browser/agentSessions/experiments/agentTitleBarStatusWidget.ts`

Relevant commits in the window before parent:
- `a84bfab7bc7` (Do not show unread on empty workspace)
- `69d1718f97f` (harden read/unread tracking)
- `63f6c69f413` (running chat marked in-progress)
- `49b3376eee4` (`chat.viewSessions.enabled` interaction)
- `bb25992d5c5` (input required indicator)
- `3a95c41dac6` (initial introduction of this widget and filter toggle/restore behavior)

Behavior found in parent commit:
- Widget listens for profile-scoped filter storage changes and re-renders.
- `_clearFilterIfCategoryEmpty(...)` runs during render and calls `_restoreUserFilter()`.
- `_restoreUserFilter()` falls back to `_clearFilter()` when no previous filter is saved.
- Previous filter backup key is global (`agentSessions.filterExcludes.previousUserFilter`), not window-scoped.

This combination allows one window’s render path to clear or restore filter state set by another window.

### Time Window Used
- Initial: 24 hours (insufficient signal)
- Final: 7 days (expanded 2 times)

## Root Cause
Filter state is profile-scoped by design, but the title-bar widget’s temporary “previous filter” restore logic is not window-aware. With multiple windows:
- one window applies badge filter,
- another window re-renders with different local counts,
- auto-clear path restores/clears profile filter globally,
- active window appears to “toggle everything off”.

## Proposed Fix

### Option A: Targeted Fix (Recommended)
**Affected Files:**
- `src/vs/workbench/contrib/chat/browser/agentSessions/experiments/agentTitleBarStatusWidget.ts`

**Changes Required:**
1. Make the temporary backup key window-scoped (e.g. suffix with `mainWindow.vscodeWindowId`).
2. Save an explicit default filter snapshot when no stored filter exists, so toggle-off can still restore correctly in that same window.
3. In `_restoreUserFilter()`, restore only from the current window’s backup key; if missing, **do not clear global filter** (no-op).

This is minimal, file-local, and avoids changing broader `AgentSessionsFilter` storage scope this late in iteration.

**Code Sketch:**
```ts
// before
const PREVIOUS_FILTER_STORAGE_KEY = 'agentSessions.filterExcludes.previousUserFilter';

// after
private _previousFilterStorageKey(): string {
	return `agentSessions.filterExcludes.previousUserFilter.${mainWindow.vscodeWindowId}`;
}

private _saveUserFilter(): void {
	const { isFilteredToUnread, isFilteredToInProgress } = this._getCurrentFilterState();
	if (isFilteredToUnread || isFilteredToInProgress) {
		return;
	}

	const currentFilter = this._getStoredFilter() ?? {
		providers: [],
		states: [],
		archived: true,
		read: false
	};

	this.storageService.store(
		this._previousFilterStorageKey(),
		JSON.stringify(currentFilter),
		StorageScope.PROFILE,
		StorageTarget.USER
	);
}

private _restoreUserFilter(): void {
	const key = this._previousFilterStorageKey();
	const previousFilterStr = this.storageService.get(key, StorageScope.PROFILE);
	if (!previousFilterStr) {
		return; // prevent other windows from clearing shared filter state
	}

	try {
		this._storeFilter(JSON.parse(previousFilterStr));
	} catch {
		this._clearFilter();
	}

	this.storageService.remove(key, StorageScope.PROFILE);
}
```

### Option B: Comprehensive Fix (Optional)
Change agent session filter persistence from profile scope to window scope in `AgentSessionsFilter` and all consumers.

Trade-off:
- More correct architectural model for multi-window behavior
- Broader behavioral change, more files, higher regression risk for this targeted iteration

## Confidence Level: Medium-High

## Reasoning
- The issue comment from maintainer explicitly identifies multi-window + profile-scoped filter interaction.
- Parent commit code shows a render-time auto-clear path that can execute in any window listening to shared storage.
- Making temporary restore state window-scoped and preventing fallback global clears when no local backup exists directly blocks the cross-window clobber while preserving expected per-window toggle UX.
- The fix is intentionally minimal and constrained to the title-bar widget (aligns with a targeted release fix).
