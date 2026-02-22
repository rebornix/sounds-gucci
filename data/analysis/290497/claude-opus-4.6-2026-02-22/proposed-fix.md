# Bug Analysis: Issue #290352

## Understanding the Bug

When the "agent status control" experiment is enabled, selecting multiple session **state** filters causes a reset. Specifically:

1. User opens Chat view and unchecks "Completed" from the session status filter → works fine
2. User then unchecks "In Progress" → all filters reset to default (everything checked)

This only affects session **status** filters — provider filters work correctly. @bpasero confirmed the bug doesn't reproduce when the agent status control experiment is disabled.

## Git History Analysis

### Time Window Used
- Initial: 24 hours
- Final: 24 hours (no expansion needed)

Only one commit touched the status widget file: `864a3b98f89` ("Add debug logging for file dialog default path selection (#289977)") — a large squash commit that included the entire `AgentTitleBarStatusWidget` implementation. The grouping redesign commit `b7af4521882` only moved an enum to a constants file.

## Root Cause

The bug is in `AgentTitleBarStatusWidget._getCurrentFilterState()` in `src/vs/workbench/contrib/chat/browser/agentSessions/experiments/agentTitleBarStatusWidget.ts` (line 830). 

The detection for "filtered to in-progress" is too loose:

```typescript
// Detect if filtered to in-progress (2 excluded states = Completed + Failed)
const isFilteredToInProgress = filter.states?.length === 2 && filter.read === false;
```

This only checks `states.length === 2` — it doesn't verify WHICH specific states are excluded. When the user manually excludes exactly 2 states (e.g., "Completed" + "In Progress"), the widget falsely identifies this as a badge-applied "in-progress" filter.

**The cascade that causes the reset:**

1. User excludes "Completed" → `states: [Completed]` stored → no issue (1 state)
2. User excludes "In Progress" → `states: [Completed, InProgress]` stored
3. Storage change event fires → `AgentTitleBarStatusWidget._render()` runs
4. `_renderStatusBadge()` → `_clearFilterIfCategoryEmpty(hasUnread, hasActive)`
5. `_getCurrentFilterState()` returns `isFilteredToInProgress: true` (false positive: `states.length === 2 && read === false`)
6. If no active in-progress sessions exist (common scenario), `!hasActiveSessions` is true
7. `_restoreUserFilter()` is called — but no previous user filter was saved (the user never used the badge filter), so it falls through to `_clearFilter()`
8. `_clearFilter()` stores `{ providers: [], states: [], archived: true, read: false }` → **filters reset to default**

The badge filter for "in-progress" actually excludes `[Completed, Failed]` (line 945-948), but the detection doesn't check for these specific states.

## Proposed Fix

### Option A: Targeted Fix (Recommended)

**Affected Files:**
- `src/vs/workbench/contrib/chat/browser/agentSessions/experiments/agentTitleBarStatusWidget.ts`

**Changes Required:**

Fix `_getCurrentFilterState()` to check for the **specific states** that the badge filter uses, not just the count.

**Code Sketch:**

```typescript
private _getCurrentFilterState(): { isFilteredToUnread: boolean; isFilteredToInProgress: boolean } {
    const filter = this._getStoredFilter();
    if (!filter) {
        return { isFilteredToUnread: false, isFilteredToInProgress: false };
    }

    // Detect if filtered to unread (read=true excludes read sessions, leaving only unread)
    const isFilteredToUnread = filter.read === true && filter.states.length === 0;
    // Detect if filtered to in-progress (exactly Completed + Failed excluded)
    const isFilteredToInProgress = filter.states?.length === 2
        && filter.states.includes(AgentSessionStatus.Completed)
        && filter.states.includes(AgentSessionStatus.Failed)
        && filter.read === false;

    return { isFilteredToUnread, isFilteredToInProgress };
}
```

This prevents false-positive detection when the user manually excludes any 2 arbitrary states (like Completed + InProgress).

### Option B: Broader Fix

In addition to Option A, consider adding a flag or marker to distinguish between badge-applied filters vs. user-applied filters, rather than reverse-engineering the filter state from the storage value. This would make the detection more robust against future changes to the badge filter configuration.

For example, store a marker alongside the filter:
```typescript
this.storageService.store('agentSessions.filterAppliedByBadge', 'true', StorageScope.PROFILE, StorageTarget.USER);
```
and only auto-clear when this marker is present.

## Confidence Level: High

## Reasoning

1. The bug only occurs when the agent status control experiment is enabled — this directly points to `AgentTitleBarStatusWidget`
2. The widget shares the same storage key as `AgentSessionsFilter` and reacts to storage changes by re-rendering
3. During rendering, `_clearFilterIfCategoryEmpty` uses the imprecise `_getCurrentFilterState()` detection
4. The detection at line 830 (`states.length === 2`) matches any combination of 2 excluded states, not just the specific `[Completed, Failed]` pair used by the badge filter
5. When falsely detected as a badge filter with no active sessions, `_restoreUserFilter()` falls through to `_clearFilter()`, resetting everything
6. The user's second filter selection (unchecking "In Progress" after "Completed") creates exactly a 2-state exclusion, triggering the false detection
