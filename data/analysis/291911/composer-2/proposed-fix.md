# Bug Analysis: Issue #290863

## Understanding the Bug

With **two VS Code windows** open on the same profile, using the **agent status** title bar indicators to switch filters (e.g. unread → in progress) can **clear all filters** or make filters **flicker**. The agent sessions filter state is stored in **profile** storage, so it is **shared across every window**. The title bar widget also runs logic on each render that **auto-restores** the filter when it thinks the “filtered category” is empty (`_clearFilterIfCategoryEmpty`). That decision uses **this window’s** session counts from `agentSessionsService.model`. A second window whose model shows **no unread** or **no in-progress** sessions (different workspace, timing, or UI state) can **write back** to the shared profile key and **exit** the filter the user set in the first window—matching the maintainer note that “the window without any pending notifications” triggers leaving the filter.

## Git History Analysis

At parent `da5a231c63aece4107062e27b1498128c9fde293`, a short window before the parent did not surface additional related commits; the relevant behavior is visible directly in the current sources.

### Time Window Used

- Initial: 24 hours  
- Final: 3 days (minimal additional context from `git log`)

## Root Cause

1. **`AgentSessionsFilter`** persists `excludes` with `StorageScope.PROFILE` (`agentSessionsFilter.ts`: `get` / `store` / `remove` / `onDidChangeValue`).
2. **`AgentTitleBarStatusWidget`** reads/writes the **same logical key** (`agentSessions.filterExcludes.agentsessionsviewerfiltersubmenu`) and `PREVIOUS_FILTER_STORAGE_KEY` using **`StorageScope.PROFILE`**, and listens for profile storage changes.
3. **`_clearFilterIfCategoryEmpty`** runs from **`_renderStatusBadge`** and compares profile-stored filter state to **local** `hasUnreadSessions` / `hasActiveSessions`. Any window that renders with “empty” categories relative to **its** model can call **`_restoreUserFilter()`**, mutating shared profile storage and affecting other windows.

## Proposed Fix

### Option A: Targeted Fix (Recommended)

**Scope agent sessions filter persistence to the workspace** instead of the profile, so each workspace’s filter state is independent across windows. This aligns with the maintainer suggestion to move off `PROFILE` for this feature and stops cross-workspace / cross-window interference while keeping filter UI and title bar in sync **within** a workspace.

**Affected Files:**

- `src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsFilter.ts`
- `src/vs/workbench/contrib/chat/browser/agentSessions/experiments/agentTitleBarStatusWidget.ts`

**Changes Required:**

1. **`agentSessionsFilter.ts`**  
   - Replace every `StorageScope.PROFILE` used for `STORAGE_KEY` with **`StorageScope.WORKSPACE`**:  
     - `updateExcludes`: `storageService.get(..., StorageScope.WORKSPACE)`  
     - `storeExcludes`: `remove` / `store` with `StorageScope.WORKSPACE`  
     - `registerListeners`: `onDidChangeValue(StorageScope.WORKSPACE, this.STORAGE_KEY, ...)`

2. **`agentTitleBarStatusWidget.ts`**  
   - For `FILTER_STORAGE_KEY`, `PREVIOUS_FILTER_STORAGE_KEY`, and the storage listener that re-renders on filter changes, use **`StorageScope.WORKSPACE`** consistently with `get` / `store` / `remove` / `onDidChangeValue`.

**Code Sketch (representative):**

```typescript
// agentSessionsFilter.ts — use WORKSPACE for filter persistence
this._register(this.storageService.onDidChangeValue(StorageScope.WORKSPACE, this.STORAGE_KEY, this._store)(() => this.updateExcludes(true)));
// ... get/store/remove: StorageScope.WORKSPACE

// agentTitleBarStatusWidget.ts — match scope for the same keys
this.storageService.get(FILTER_STORAGE_KEY, StorageScope.WORKSPACE);
this.storageService.onDidChangeValue(StorageScope.WORKSPACE, 'agentSessions.filterExcludes.agentsessionsviewerfiltersubmenu', this._store)(...)
```

**Follow-up:** Unit tests under `src/vs/workbench/contrib/chat/test/browser/agentSessions/agentSessionViewModel.test.ts` that seed `agentSessions.filterExcludes.*` with `StorageScope.PROFILE` should be updated to **`StorageScope.WORKSPACE`** so they still reflect the filter implementation.

### Option B: Widget-only mitigation (narrower)

Remove or heavily gate **`_clearFilterIfCategoryEmpty`** so a window cannot clear profile-wide filter state based only on its local session stats. This is a smaller diff but **does not** fix shared profile storage; two windows can still fight over the same keys. Prefer Option A unless product explicitly wants profile-wide filters with different semantics.

## Confidence Level: High

## Reasoning

- Issue comments identify **profile-scoped** filters and **multiple windows** as the cause; the cited lines in `agentSessionsFilter.ts` match `StorageScope.PROFILE` usage.
- The title bar widget **writes** the same keys and runs **auto-restore** when local counts say the filtered category is empty—exactly the cross-window failure mode described.
- Moving filter state to **`StorageScope.WORKSPACE`** keeps the sessions view and title bar widget aligned (same keys, same scope) while isolating state per workspace so another window’s render path cannot clear filters for a different workspace.
