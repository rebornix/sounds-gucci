# Bug Analysis: Issue #290863

## Understanding the Bug

The bug occurs when a user has multiple VS Code windows open and attempts to filter agent sessions by clicking on the session status indicators (unread or in-progress) in the title bar. The symptoms are:

1. User has two or more VS Code windows open (confirmed by @benibenj and @joshspicer)
2. User clicks the "unread" session indicator in Window 1
3. User then clicks the "in progress" indicator  
4. 🐛 **Bug**: All filters toggle off unexpectedly

The root cause is that filter state is stored using `StorageScope.PROFILE`, which is shared across all VS Code windows within the same profile. This creates a race condition where:

1. Window 1 applies a filter (e.g., "unread") → saves to PROFILE storage
2. Window 2 receives storage change event via listener → re-renders its widget
3. Window 2's `_clearFilterIfCategoryEmpty()` method checks if it has unread sessions
4. Window 2 doesn't have unread sessions → restores previous filter (clearing the filter)
5. Window 1 receives storage change event → filter is cleared → all filters toggle off

The issue comment by @joshspicer on 2026-01-30 confirms this:
> "Confirmed with @benibenj that he has two VS Code window open, which I believe is the cause of the bug. Currently filters are stored per profile, which is causing this unexpected behavior. The window without any pending notifications sees that and triggers exiting the filter. We should think about changing the scope of filtering from PROFILE to perhaps the window?"

## Git History Analysis

### Time Window Used
- Initial: 24 hours  
- Final: 72 hours (expanded once)

### Relevant Commits Found

The issue references PR #290650, which introduced the filtering functionality. A related commit was found:
- `c7ff1fc07b3` - "Expand More section when filtering is active in stacked view" (Fixes #290650)

This confirms that the filtering feature is relatively new, and the multi-window edge case was not initially considered.

## Root Cause

The agent session filter state is stored with **`StorageScope.PROFILE`**, which is shared across all windows in the same profile. The problematic code is in:

**File**: `src/vs/workbench/contrib/chat/browser/agentSessions/experiments/agentTitleBarStatusWidget.ts`

**Lines 57-59**:
```typescript
const FILTER_STORAGE_KEY = 'agentSessions.filterExcludes.agentsessionsviewerfiltersubmenu';
const PREVIOUS_FILTER_STORAGE_KEY = 'agentSessions.filterExcludes.previousUserFilter';
```

**Line 906** (`_getStoredFilter`):
```typescript
const filterStr = this.storageService.get(FILTER_STORAGE_KEY, StorageScope.PROFILE);
```

**Line 921** (`_storeFilter`):
```typescript
this.storageService.store(FILTER_STORAGE_KEY, JSON.stringify(filter), StorageScope.PROFILE, StorageTarget.USER);
```

**Line 952** (`_saveUserFilter`):
```typescript
this.storageService.store(PREVIOUS_FILTER_STORAGE_KEY, JSON.stringify(currentFilter), StorageScope.PROFILE, StorageTarget.USER);
```

**Line 960** (`_restoreUserFilter`):
```typescript
const previousFilterStr = this.storageService.get(PREVIOUS_FILTER_STORAGE_KEY, StorageScope.PROFILE);
```

**Line 974** (`_restoreUserFilter`):
```typescript
this.storageService.remove(PREVIOUS_FILTER_STORAGE_KEY, StorageScope.PROFILE);
```

When multiple windows share the same profile, changes to these storage keys trigger the listener on line 158 in all windows, causing unexpected filter state synchronization and the `_clearFilterIfCategoryEmpty()` logic to fire inappropriately.

## Proposed Fix

### Affected Files
- `src/vs/workbench/contrib/chat/browser/agentSessions/experiments/agentTitleBarStatusWidget.ts`

### Changes Required

Change all filter storage operations from `StorageScope.PROFILE` to `StorageScope.WORKSPACE`. This will isolate filter state per window, preventing cross-window interference.

### Code Changes

**1. Change `_getStoredFilter` method (line 906)**

```typescript
// OLD:
const filterStr = this.storageService.get(FILTER_STORAGE_KEY, StorageScope.PROFILE);

// NEW:
const filterStr = this.storageService.get(FILTER_STORAGE_KEY, StorageScope.WORKSPACE);
```

**2. Change `_storeFilter` method (line 921)**

```typescript
// OLD:
this.storageService.store(FILTER_STORAGE_KEY, JSON.stringify(filter), StorageScope.PROFILE, StorageTarget.USER);

// NEW:
this.storageService.store(FILTER_STORAGE_KEY, JSON.stringify(filter), StorageScope.WORKSPACE, StorageTarget.USER);
```

**3. Change `_saveUserFilter` method (line 952)**

```typescript
// OLD:
this.storageService.store(PREVIOUS_FILTER_STORAGE_KEY, JSON.stringify(currentFilter), StorageScope.PROFILE, StorageTarget.USER);

// NEW:
this.storageService.store(PREVIOUS_FILTER_STORAGE_KEY, JSON.stringify(currentFilter), StorageScope.WORKSPACE, StorageTarget.USER);
```

**4. Change `_restoreUserFilter` method - get (line 960)**

```typescript
// OLD:
const previousFilterStr = this.storageService.get(PREVIOUS_FILTER_STORAGE_KEY, StorageScope.PROFILE);

// NEW:
const previousFilterStr = this.storageService.get(PREVIOUS_FILTER_STORAGE_KEY, StorageScope.WORKSPACE);
```

**5. Change `_restoreUserFilter` method - remove (line 974)**

```typescript
// OLD:
this.storageService.remove(PREVIOUS_FILTER_STORAGE_KEY, StorageScope.PROFILE);

// NEW:
this.storageService.remove(PREVIOUS_FILTER_STORAGE_KEY, StorageScope.WORKSPACE);
```

**6. Change storage listener (line 158)**

```typescript
// OLD:
this._register(this.storageService.onDidChangeValue(StorageScope.PROFILE, 'agentSessions.filterExcludes.agentsessionsviewerfiltersubmenu', this._store)(() => {
    this._render();
}));

// NEW:
this._register(this.storageService.onDidChangeValue(StorageScope.WORKSPACE, 'agentSessions.filterExcludes.agentsessionsviewerfiltersubmenu', this._store)(() => {
    this._render();
}));
```

### Summary of Changes

Replace **all 6 occurrences** of `StorageScope.PROFILE` with `StorageScope.WORKSPACE` in the filter-related storage operations:

1. Line 158: Storage change listener
2. Line 906: `_getStoredFilter()` - reading current filter
3. Line 921: `_storeFilter()` - storing filter state
4. Line 952: `_saveUserFilter()` - saving previous filter
5. Line 960: `_restoreUserFilter()` - reading previous filter
6. Line 974: `_restoreUserFilter()` - removing previous filter

## Confidence Level: High

## Reasoning

This fix directly addresses the root cause identified by @joshspicer in the issue comments. By changing the storage scope from PROFILE to WORKSPACE:

1. **Each window gets independent filter state**: Filter changes in one window won't affect other windows
2. **No cross-window storage events**: The storage listener on line 158 will only fire for changes in the same window
3. **`_clearFilterIfCategoryEmpty()` works correctly**: Each window evaluates its own session state independently
4. **Minimal code change**: Only changes the storage scope parameter, no logic changes required
5. **Aligns with VS Code patterns**: WORKSPACE scope is commonly used for window-specific UI state

The fix is targeted and minimal, changing only the storage scope while preserving all existing filter logic. This prevents the cross-window race condition that causes filters to toggle off unexpectedly.

### Alternative Considered

The issue comment mentions "We should think about changing the scope of filtering from PROFILE to perhaps the window?" - this confirms that WORKSPACE scope (which is per-window) is the correct solution.
