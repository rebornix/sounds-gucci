# Bug Analysis: Issue #290863

## Understanding the Bug
Clicking the title-bar unread indicator and then the in-progress indicator can leave **no filter active**. The issue is reproducible especially when multiple VS Code windows are open.

From issue comments, maintainers narrowed it down to filter state being shared too broadly: one window can observe and react to filter changes initiated in another window.

## Git History Analysis
Relevant commits (up to parent commit `da5a231c63aece4107062e27b1498128c9fde293`):

- `a84bfab7bc7` — “Agent status indicator: Do not show unread on empty workspace”
- `69d1718f97f` — “agent sessions - harden read/unread tracking”
- `63f6c69f413` — “Running chat not marked as 'in-progress' if currently viewed”
- `49b3376eee4` — “Agent status indicators react to chat.viewSessions.enabled”
- `3a95c41dac6` — introduces `agentSessionsFilter.ts` and profile-scoped filter storage/listener behavior

These changes show the title-bar widget and filter storage logic were evolving quickly in the same period, with profile-scoped persistence used by both the sessions filter and status widget.

### Time Window Used
- Initial: 24 hours
- Final: 72 hours (expanded once)

## Root Cause
`agentTitleBarStatusWidget.ts` stores temporary badge filters (unread / in-progress) in **profile-scoped** storage under:

- `agentSessions.filterExcludes.agentsessionsviewerfiltersubmenu`
- `agentSessions.filterExcludes.previousUserFilter`

The widget also auto-restores filters in `_clearFilterIfCategoryEmpty(...)` when the currently filtered category appears empty in that window.

With multiple windows open:
1. Window A applies unread/in-progress filter.
2. Window B receives the same profile-scoped filter state.
3. Window B may have no matching sessions and calls `_restoreUserFilter()`.
4. This writes back to shared storage, effectively clearing/toggling the filter for Window A.

Result: visible flicker and “all filters off” after indicator clicks.

## Proposed Fix

### Option A: Targeted Fix (Recommended)
**Affected Files:**
- `src/vs/workbench/contrib/chat/browser/agentSessions/experiments/agentTitleBarStatusWidget.ts`

**Changes Required:**
Introduce a **window-local ownership guard** so only the window that initiated a badge filter may auto-restore it when a category becomes empty.

Concretely:
- Add a private boolean/enum field (e.g. `this._localBadgeFilter: 'unread' | 'inProgress' | undefined`).
- In `_openSessionsWithFilter(...)`:
  - when applying unread/in-progress filter, set `_localBadgeFilter` accordingly.
  - when toggling off (restore path), clear `_localBadgeFilter`.
- In `_clearFilterIfCategoryEmpty(...)`:
  - before calling `_restoreUserFilter()`, require that `_localBadgeFilter` matches the currently active badge filter.
  - if not locally owned, do nothing (do not clear shared filter from this window).
- In `_restoreUserFilter()`, clear `_localBadgeFilter` after successful restore.

This preserves current UX (auto-clear when own filtered category disappears) while preventing unrelated windows from clearing filters they didn’t initiate.

**Code Sketch:**
```ts
private _localBadgeFilter: 'unread' | 'inProgress' | undefined;

private _clearFilterIfCategoryEmpty(hasUnreadSessions: boolean, hasActiveSessions: boolean): void {
	const { isFilteredToUnread, isFilteredToInProgress } = this._getCurrentFilterState();

	const shouldRestoreUnread = isFilteredToUnread && !hasUnreadSessions && this._localBadgeFilter === 'unread';
	const shouldRestoreInProgress = isFilteredToInProgress && !hasActiveSessions && this._localBadgeFilter === 'inProgress';

	if (shouldRestoreUnread || shouldRestoreInProgress) {
		this._restoreUserFilter();
	}
}

private _openSessionsWithFilter(filterType: 'unread' | 'inProgress'): void {
	...
	if (filterType === 'unread') {
		if (isFilteredToUnread) {
			this._restoreUserFilter();
			this._localBadgeFilter = undefined;
		} else {
			this._saveUserFilter();
			this._storeFilter({ providers: preservedProviders, states: [], archived: true, read: true });
			this._localBadgeFilter = 'unread';
		}
	} else {
		if (isFilteredToInProgress) {
			this._restoreUserFilter();
			this._localBadgeFilter = undefined;
		} else {
			this._saveUserFilter();
			this._storeFilter({ providers: preservedProviders, states: [AgentSessionStatus.Completed, AgentSessionStatus.Failed], archived: true, read: false });
			this._localBadgeFilter = 'inProgress';
		}
	}
}
```

### Option B: Comprehensive Fix (Optional)
Move badge filter persistence from `StorageScope.PROFILE` to a true window-scoped mechanism (or include window identity in the stored payload and ignore cross-window auto-restore). This is architecturally cleaner for multi-window isolation but requires touching both widget and shared filter plumbing and is higher risk for this iteration.

## Confidence Level: High

## Reasoning
The issue report explicitly identifies multi-window interaction and profile scope as the trigger. The current code path confirms that filter writes and auto-restore are profile-scoped and can be triggered by any window’s local session counts. A window-local ownership guard is the minimal, low-risk change that prevents cross-window clearing while preserving existing toggle behavior in the initiating window.