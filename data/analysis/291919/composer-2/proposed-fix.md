# Bug Analysis: Issue #290863

## Understanding the Bug

**Expected:** Clicking the title-bar unread count, then the in-progress indicator, should keep the sessions view filtered (first to unread-only, then to in-progress), without dropping all filters.

**Actual:** With **multiple VS Code windows** open, filters can clear or flicker—clicking between unread and in-progress sometimes turns filters off entirely. Maintainers traced this to **profile-scoped filter state** combined with **per-window session counts**: one window that sees “no unread” or “no in-progress” can undo filter state that another window relies on.

**Repro (from issue):** Unread + in-progress sessions exist → click unread badge → click in-progress badge → filters end up cleared. Worse with two windows (one may have no pending sessions for a category).

## Git History Analysis

Searched `git log` in a 7-day window ending at parent `df6ff376e270fbfb56c38a93b7f72f823414c0e2`; no additional narrowly related commits surfaced beyond routine merges. Investigation focused on code paths referenced in the issue thread (`agentSessionsFilter.ts` storage scope and title-bar badge behavior).

### Time Window Used

- Initial: 24 hours (expanded for coverage)
- Final: 7 days

## Root Cause

1. **Shared storage:** Agent session filter exclude state for the sessions UI is persisted with `StorageScope.PROFILE` in `agentSessionsFilter.ts` (read/store/remove and `onDidChangeValue` all use `PROFILE`). The title-bar status widget uses the same pattern for `FILTER_STORAGE_KEY` / `PREVIOUS_FILTER_STORAGE_KEY` in `agentTitleBarStatusWidget.ts`.

2. **Per-window render logic:** `_renderStatusBadge` calls `_clearFilterIfCategoryEmpty(hasUnreadSessions, hasActiveSessions)` on every render. Those booleans come from **this window’s** session stats.

3. **Cross-window interference:** If Window A applies an “unread” or “in-progress” badge filter (stored in shared profile storage), Window B may render with **zero** unread or zero in-progress sessions in **its** stats. `_clearFilterIfCategoryEmpty` then decides the “filtered category is empty” and calls `_restoreUserFilter()`, which rewrites profile storage—**clearing or resetting filters for all windows**, including A. That matches the reported “toggles all filters off” and flicker when switching indicators.

`StorageScope` at this revision exposes `APPLICATION`, `PROFILE`, and `WORKSPACE`—there is no first-class “window” scope, so fixing purely by scope requires either moving keys to `WORKSPACE` (only helps when windows use different workspaces) or **not auto-clearing based on another window’s idea of emptiness**.

## Proposed Fix

### Option A: Targeted fix (recommended)

**Affected file**

- `src/vs/workbench/contrib/chat/browser/agentSessions/experiments/agentTitleBarStatusWidget.ts`

**Idea:** Only run the “category became empty → restore user filter” logic when **this window** was the one that applied the unread/in-progress badge filter. Track that in **instance state** on the widget (in-memory, per window), set when `_openSessionsWithFilter` applies a badge filter, and clear it when `_restoreUserFilter` completes.

**Changes**

1. Add a private field, e.g. `_badgeFilterAppliedByThisWindow: 'unread' | 'inProgress' | null`, default `null`.

2. In `_openSessionsWithFilter`, when storing the unread filter (`read: true`, etc.), set the field to `'unread'`; when storing the in-progress filter (two excluded states), set it to `'inProgress'`. When toggling off via `_restoreUserFilter` path from the badge, rely on existing restore flow.

3. Rewrite `_clearFilterIfCategoryEmpty` so it **does not** use only `_getCurrentFilterState()` + empty counts. Instead:
   - If `_badgeFilterAppliedByThisWindow === 'unread'` and `!hasUnreadSessions`, call `_restoreUserFilter()`.
   - Else if `_badgeFilterAppliedByThisWindow === 'inProgress'` and `!hasActiveSessions`, call `_restoreUserFilter()`.
   - Otherwise do nothing (avoid clearing when another window set the profile filter or the user set filters from the menu).

4. In `_restoreUserFilter`, after removing `PREVIOUS_FILTER_STORAGE_KEY`, set `_badgeFilterAppliedByThisWindow = null` so future renders do not think a badge filter is still active.

This preserves **profile-scoped** sharing of manual filter choices while stopping **automatic** clears from windows that did not apply the badge filter.

**Code sketch**

```typescript
// field on class
private _badgeFilterAppliedByThisWindow: 'unread' | 'inProgress' | null = null;

private _clearFilterIfCategoryEmpty(hasUnreadSessions: boolean, hasActiveSessions: boolean): void {
	if (this._badgeFilterAppliedByThisWindow === 'unread' && !hasUnreadSessions) {
		this._restoreUserFilter();
	} else if (this._badgeFilterAppliedByThisWindow === 'inProgress' && !hasActiveSessions) {
		this._restoreUserFilter();
	}
}

// in _openSessionsWithFilter, after _storeFilter for unread branch:
this._badgeFilterAppliedByThisWindow = 'unread';
// after _storeFilter for in-progress branch:
this._badgeFilterAppliedByThisWindow = 'inProgress';

// end of _restoreUserFilter:
this._badgeFilterAppliedByThisWindow = null;
```

### Option B: Broader scope — `WORKSPACE` storage

Move `FILTER_STORAGE_KEY`, `PREVIOUS_FILTER_STORAGE_KEY`, and the matching keys in `agentSessionsFilter.ts` from `StorageScope.PROFILE` to `StorageScope.WORKSPACE`, and update `onDidChangeValue` listeners accordingly.

**Trade-offs:** Helps when each window is a different workspace; **does not** fix two windows on the **same** workspace. Touches more call sites and may surprise users who expect filters to follow the profile across workspaces.

## Confidence Level: High

## Reasoning

The failure mode is explained by **shared profile storage** plus **auto-restore driven by per-window counts**. Gating auto-clear on “this window applied the badge filter” directly prevents Window B from clearing Window A’s badge-driven state without requiring new storage APIs. The change is localized to the title-bar widget’s orchestration of `_clearFilterIfCategoryEmpty` / `_openSessionsWithFilter` / `_restoreUserFilter`, which is where the destructive storage updates originate during render.
