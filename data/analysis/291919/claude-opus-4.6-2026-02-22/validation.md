# Fix Validation: PR #291919

## Actual Fix Summary

The actual fix adds **per-window instance tracking** to the `AgentTitleBarStatusWidget` class to prevent cross-window filter interference. Instead of changing the storage scope, it introduces a `_badgeFilterAppliedByThisWindow` instance variable that tracks whether the current window applied a badge filter ("unread" or "inProgress"). The auto-clear logic (`_clearFilterIfCategoryEmpty`) is then gated on this variable, so only the window that applied the badge filter will auto-clear it — preventing Window B from clearing filters that Window A set.

### Files Changed
- `src/vs/workbench/contrib/chat/browser/agentSessions/experiments/agentTitleBarStatusWidget.ts` - Added `_badgeFilterAppliedByThisWindow` instance variable, modified `_clearFilterIfCategoryEmpty` to check per-window tracking, set tracking when applying badge filters, clear tracking when restoring filters

### Approach
Conservative, targeted fix: keep `StorageScope.PROFILE` shared filter storage, but add per-window instance state to gate the auto-clear behavior. Includes a TODO acknowledging this is imperfect and that per-window filter storage should be revisited.

## Proposal Comparison

### Files Overlap
| Proposal | Actual | Match |
|----------|--------|-------|
| `agentSessionsFilter.ts` | - | ❌ (extra) |
| - | `experiments/agentTitleBarStatusWidget.ts` | ❌ (missed) |

**Overlap Score:** 0/1 files (0%)

### Root Cause Analysis
- **Proposal's root cause:** Filter state stored with `StorageScope.PROFILE` is shared across all windows, causing cross-window interference when one window's auto-clear logic resets filters set by another window.
- **Actual root cause:** Same — the cross-window interference stems from shared PROFILE-scoped storage. Specifically, the `_clearFilterIfCategoryEmpty` method in the widget would auto-clear filters regardless of which window applied them.
- **Assessment:** ✅ Correct — The proposal accurately identifies the root cause. The issue commenter (@joshspicer) explicitly confirmed this diagnosis.

### Approach Comparison
- **Proposal's approach:** Change `StorageScope.PROFILE` → `StorageScope.WORKSPACE` in 4 locations in `agentSessionsFilter.ts`, making filter state per-workspace rather than shared.
- **Actual approach:** Keep `StorageScope.PROFILE` but add per-window instance tracking (`_badgeFilterAppliedByThisWindow`) in the widget class to gate auto-clear behavior, preventing cross-window interference at the widget level.
- **Assessment:** Fundamentally different strategies. The proposal attacks the problem at the storage layer (change scope), while the actual fix attacks it at the consumer layer (gate behavior). Both would prevent the bug. The actual fix is more conservative — it preserves shared filter state (so switching windows retains filters) while only preventing the auto-clear side effect. Notably, the actual fix includes a TODO: *"This is imperfect. Targetted fix for vscode#290863. We should revisit storing filter state per-window to avoid this"* — suggesting the proposal's approach is the preferred long-term solution.

## Alignment Score: 3/5 (Partial)

## Detailed Feedback

### What the proposal got right
- Correctly identified the root cause: cross-window interference via `StorageScope.PROFILE`
- Identified the correct storage locations in `agentSessionsFilter.ts` that use PROFILE scope
- Proposed a viable fix that would prevent the bug
- The approach is even acknowledged in the actual fix's TODO as the ideal long-term direction
- High confidence was justified given the maintainer's explicit diagnosis in issue comments

### What the proposal missed
- The actual fix was in `agentTitleBarStatusWidget.ts`, not `agentSessionsFilter.ts` — the problem was specifically in the widget's `_clearFilterIfCategoryEmpty` auto-clear logic, not in the filter storage itself
- The "targeted fix" nature of the PR: the actual fix deliberately chose a minimal, conservative approach over the broader storage scope change
- The nuance that changing to `StorageScope.WORKSPACE` has side effects — filters would no longer be shared across windows, which may be undesirable for user experience in some scenarios

### What the proposal got wrong
- Targeted the wrong file entirely (0% file overlap)
- The approach, while valid, was too aggressive for what was intended as a "targetted fix" for release

## Recommendations for Improvement
- When a PR title says "targetted fix," look for the most minimal/conservative change possible rather than the most thorough architectural solution
- Investigate not just where the shared state is *stored* but where it is *consumed* — the auto-clear logic in the widget was the specific trigger for the bug, not the storage mechanism itself
- Consider that the widget class (`agentTitleBarStatusWidget.ts`) is where badge clicks and auto-clear logic live, making it the natural place for a targeted behavioral fix
