# Bug Analysis: Issue #290346

## Understanding the Bug
The issue reports that unread indicators in Chat Overview are inconsistent after restart: sessions that were already opened/read reappear as unread (blue dots), especially for local sessions. A second user confirms that after manually marking all sessions read, opening a new VS Code window shows them unread again.

Maintainer comments indicate two important constraints:
- unread/read state is currently tracked per workspace,
- old unread tracking was buggy and should be reset to a clean baseline.

So the practical symptom to fix here is stale/incorrect unread state surviving across restarts and being re-applied in ways that look random.

## Git History Analysis
The parent snapshot is `4a54efe6fcf72adb92b94891a7c7d35a8753a40e` (2026-01-28). In this checkout, the unread tracking implementation in `agentSessionsModel.ts` is very recent and attributed to commit `3a95c41dac6...`.

Key findings from code/blame inspection:
- `AgentSessionsModel.READ_STATE_INITIAL_DATE` is fixed at **Dec 8, 2025**.
- session read/archive state is persisted under `agentSessions.state.cache` in **workspace storage**.
- `isRead()` falls back to the fixed initial date whenever no explicit `read` timestamp exists.

This means old persisted `read` states (including buggy ones) continue to dominate behavior across restart, and the fixed baseline date can still classify many historical sessions as unread.

### Time Window Used
- Initial: 24 hours
- Final: 24 hours (no expansion possible in this prepared parent snapshot)

## Root Cause
Unread state is computed from two sources that were introduced together and can preserve bad history:

1. **Persisted read state cache (`agentSessions.state.cache`)**
   - If this cache contains stale/incorrect entries from earlier buggy behavior, those entries are reused on restart.

2. **Static default unread cutoff (`READ_STATE_INITIAL_DATE = 2025-12-08`)**
   - Sessions after that date are considered unread unless explicitly read.
   - When persisted state is absent/incomplete/inconsistent, this old cutoff can still make many existing sessions appear unread.

Together, this matches the reported “flaky/random unread” behavior after restart/window changes.

## Proposed Fix

### Option A: Targeted Fix (Recommended)
Perform a one-time unread state reset in `AgentSessionsModel`:

**Affected Files:**
- `src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsModel.ts`
- `src/vs/workbench/contrib/chat/test/browser/agentSessions/agentSessionViewModel.test.ts`

**Changes Required:**
1. **Bump the persisted read-state storage key** so old buggy unread/read entries are ignored:
   - from `agentSessions.state.cache`
   - to `agentSessions.state.cache.v2` (or similar)

2. **Move `READ_STATE_INITIAL_DATE` forward** to a fresh-start date (around fix rollout, e.g. late Jan 2026), so existing sessions are treated as read by default unless newly created afterward.

3. **Update tests** that assert before/after behavior around `READ_STATE_INITIAL_DATE` to reflect the new baseline date.

This is minimal, low-risk, and directly aligned with maintainer intent (“reset unread state so we have a fresh start”).

**Code Sketch:**
```ts
// agentSessionsModel.ts
// Reset unread baseline to avoid carrying over buggy old tracking.
private static readonly READ_STATE_INITIAL_DATE = Date.UTC(2026, 0 /* January */, 28);

class AgentSessionsCache {
  private static readonly SESSIONS_STORAGE_KEY = 'agentSessions.model.cache';
  private static readonly STATE_STORAGE_KEY = 'agentSessions.state.cache.v2';
}
```

```ts
// agentSessionViewModel.test.ts
// Update test timestamps/comments so "before initial date => read"
// and "after initial date => unread" still validate the same contract.
```

### Option B: Comprehensive Fix (Optional)
Redesign unread tracking scope so session read-state is not workspace-local for providers whose sessions are global/shared across windows, while keeping workspace-specific behavior where needed.

Trade-offs:
- More correct long-term behavior across windows/workspaces.
- Significantly larger change (storage schema + migration + product decision), not suitable for a quick stabilization fix.

## Confidence Level: High

## Reasoning
The code path that computes unread status is centralized and simple (`isRead()` against persisted state and initial cutoff). The reported symptom is exactly what stale persisted flags + an old default cutoff would produce after restart. A state-key bump plus baseline refresh is the smallest change that removes bad historical data and restores predictable unread behavior without broad architectural changes.

Mentally tracing the fix:
- On next startup, old `agentSessions.state.cache` is not loaded.
- Sessions now default to read unless they are newer than the refreshed initial date.
- New sessions created after the reset date still behave correctly as unread until opened/marked read.

This resolves the immediate flakiness while preserving the current model semantics.