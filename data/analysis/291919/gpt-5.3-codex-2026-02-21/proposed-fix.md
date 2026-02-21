# Bug Analysis: Issue #290863

## Understanding the Bug

**Issue:** Clicking from unread to in progress toggles all filters off

**Symptoms:**
1. User has unread and in-progress sessions
2. User clicks the unread session indicator in the title
3. User then clicks the in-progress indicator in the title  
4. Bug: No filters are applied (both indicators toggle off)

**Critical Context from Comments:**
- @joshspicer (2026-01-30T15:27:34Z) confirmed the bug happens with **two VS Code windows open**
- He identified the root cause: "Currently filters are stored per profile, which is causing this unexpected behavior. The window without any pending notifications sees that and triggers exiting the filter."
- He proposed: "We should think about changing the scope of filtering from PROFILE to perhaps the window"
- He stated: "I will make a targetted fix for this iteration to solve the problem"

## Git History Analysis

### Time Window Used
- Initial: 24 hours
- Final: 168 hours (expanded 2 times)

### Relevant Commits Found
- **c7ff1fc07b3** (2026-01-28): "Expand More section when filtering is active in stacked view" - This is PR #290650 mentioned in the issue. This PR added filtering functionality, which the current bug is related to.

The bug appears to be a design flaw in how filter state is shared across windows rather than a recent regression.

## Root Cause

The filter state is stored using `StorageScope.PROFILE`, which means the filter configuration is **shared across all windows within the same profile**.

**The problematic flow:**

1. **Window A** (with notifications): User clicks "unread" filter
   - Filter stored to PROFILE scope with `states: ['unread']`
   - `onDidChangeValue` listener fires in Window A ✓

2. **Window B** (without notifications): Storage listener fires
   - Sees filter update via `onDidChangeValue(StorageScope.PROFILE, ...)`
   - Updates its local filter state to match
   - Window B has no unread sessions, so its model/counts are zero

3. **Window A**: User clicks "in progress" filter
   - Window A updates filter to `states: ['in_progress']`
   - Stores to PROFILE scope

4. **Window B**: Storage listener fires again
   - Updates to show "in progress" filter
   - But Window B has no in-progress sessions either
   - Some logic (possibly status widget logic) sees empty state and clears the filter
   - Stores **empty filter** back to PROFILE scope

5. **Window A**: Storage listener fires due to Window B's change
   - Sees empty filter state from Window B
   - Updates its own state, clearing both filters
   - **Result: No filters are applied** ❌

The fundamental issue: **PROFILE scope causes cross-window synchronization of filter state, even though each window has different session availability**.

## Proposed Fix

### Option A: Targeted Fix (Recommended)

**Affected Files:**
- `src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsFilter.ts`

**Changes Required:**
Change the storage scope from `StorageScope.PROFILE` to `StorageScope.WORKSPACE`. This makes filter state isolated per window/workspace, preventing cross-window interference.

**Code Changes:**

**Change 1:** Line 107 - Update storage removal scope
```typescript
// OLD:
this.storageService.remove(this.STORAGE_KEY, StorageScope.PROFILE);

// NEW:
this.storageService.remove(this.STORAGE_KEY, StorageScope.WORKSPACE);
```

**Change 2:** Line 109 - Update storage store scope
```typescript
// OLD:
this.storageService.store(this.STORAGE_KEY, JSON.stringify(this.excludes), StorageScope.PROFILE, StorageTarget.USER);

// NEW:
this.storageService.store(this.STORAGE_KEY, JSON.stringify(this.excludes), StorageScope.WORKSPACE, StorageTarget.USER);
```

**Change 3:** Line 75 - Update storage listener scope
```typescript
// OLD:
this._register(this.storageService.onDidChangeValue(StorageScope.PROFILE, this.STORAGE_KEY, this._store)(() => this.updateExcludes(true)));

// NEW:
this._register(this.storageService.onDidChangeValue(StorageScope.WORKSPACE, this.STORAGE_KEY, this._store)(() => this.updateExcludes(true)));
```

**Change 4:** Line 80 - Update storage get scope
```typescript
// OLD:
const excludedTypesRaw = this.storageService.get(this.STORAGE_KEY, StorageScope.PROFILE);

// NEW:
const excludedTypesRaw = this.storageService.get(this.STORAGE_KEY, StorageScope.WORKSPACE);
```

**Summary of Changes:**
Replace all 4 occurrences of `StorageScope.PROFILE` with `StorageScope.WORKSPACE` in the `agentSessionsFilter.ts` file.

### Option B: Alternative Approach (More Complex)

Keep PROFILE scope but add logic to:
1. Track which window is "active" for filter management
2. Only allow the focused window to update filter state
3. Add debouncing to prevent rapid cross-window updates

**Trade-offs:** This is more complex and doesn't align with the maintainer's stated direction. The targeted fix is simpler and matches the maintainer's intent.

## Confidence Level: High

## Reasoning

1. **Maintainer confirmed the root cause:** @joshspicer explicitly identified that "filters are stored per profile" causes the bug with multiple windows

2. **Clear reproduction path:** The bug only happens with two windows open, which perfectly aligns with PROFILE scope causing cross-window sync

3. **Existing pattern:** Other agent session state already uses `StorageScope.WORKSPACE`:
   - `READ_DATE_BASELINE_KEY` uses WORKSPACE scope
   - `SESSIONS_STORAGE_KEY` uses WORKSPACE scope  
   - `STATE_STORAGE_KEY` uses WORKSPACE scope

4. **Targeted fix matches maintainer's intent:** @joshspicer said "I will make a targetted fix for this iteration" and proposed changing from PROFILE scope to "perhaps the window"

5. **Validation:** If we change to WORKSPACE scope:
   - ✓ Each window maintains its own filter state independently
   - ✓ Clicking filters in Window A won't trigger storage events in Window B
   - ✓ Each window can have different filters based on its available sessions
   - ✓ The specific symptom (filters toggling off) will not occur

The fix is minimal (4 line changes, all replacing PROFILE with WORKSPACE), surgical, and directly addresses the root cause identified by the maintainer.
