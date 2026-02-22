# Fix Validation: PR #296709

## Actual Fix Summary

The actual PR took a multi-layered approach to fix the "all lines hidden" crash:

1. **Fixed `ConstantTimePrefixSumComputer`** to handle all-zero values and empty arrays gracefully
2. **Ensured at least one visible line always exists** via a new `_ensureAtLeastOneVisibleLine()` invariant method
3. **Protected event delivery** so one throwing view model doesn't break others
4. **Reverted the defensive `setViewport` guard** from PR #287189, since the root cause is now fixed

### Files Changed
- `src/vs/editor/common/model/prefixSumComputer.ts` — Handle `undefined` idx in `getIndexOf`; fix `_indexBySum.length` when values are empty
- `src/vs/editor/common/model/textModel.ts` — Wrap `onDidChangeContentOrInjectedText` and `emitContentChangeEvent` calls in try/catch per view model
- `src/vs/editor/common/viewModel/viewModelImpl.ts` — Remove the early return in `setViewport` (revert of PR #287189)
- `src/vs/editor/common/viewModel/viewModelLines.ts` — Add `_ensureAtLeastOneVisibleLine()`, called from `_constructLines()` and `acceptVersionId()`
- `src/vs/editor/test/browser/viewModel/viewModelImpl.test.ts` — 8 new tests for hidden area edge cases
- `src/vs/editor/test/common/viewModel/prefixSumComputer.test.ts` — Comprehensive dual-implementation tests

### Approach
Instead of guarding against 0 visible lines (defensive), the fix prevents the invalid state from ever occurring by:
- Making `_ensureAtLeastOneVisibleLine()` force the first model line visible when `getViewLineCount() === 0`
- Hardening `ConstantTimePrefixSumComputer` to not crash on edge-case inputs
- Adding try/catch around per-viewModel event delivery so a broken NES view model doesn't cascade

## Proposal Comparison

### Files Overlap
| Proposal | Actual | Match |
|----------|--------|-------|
| `viewModelImpl.ts` | `viewModelImpl.ts` | ⚠️ (both touch it, but proposal adds guards while actual removes one) |
| `viewModelLines.ts` | `viewModelLines.ts` | ⚠️ (proposal adds defensive getters, actual adds `_ensureAtLeastOneVisibleLine`) |
| - | `prefixSumComputer.ts` | ❌ (missed) |
| - | `textModel.ts` | ❌ (missed) |

**Overlap Score:** 2/4 production files (50%)

### Root Cause Analysis
- **Proposal's root cause:** All lines hidden in a NES/inline-edit view model → `getViewLineMinColumn` accesses undefined because `_toValidViewLineNumber` returns 0, and `getViewLineInfo(0)` yields an invalid index. Exacerbated by PR #292846's direct event delivery model.
- **Actual root cause:** Same — all lines hidden after model edits in view models using hidden areas (NES). The `ConstantTimePrefixSumComputer` also can't handle all-zero values, and one crashing view model blocks event delivery to others.
- **Assessment:** ✅ Correct — the proposal accurately identified the root cause and the exact crash path.

### Approach Comparison
- **Proposal's approach:** Defensive guards — add `getViewLineCount() === 0` checks in `_handleVisibleLinesChanged`, `visibleLinesStabilized`, `getCompletelyVisibleViewRange`, `getVisibleRangesPlusViewportAboveBelow`, and in low-level getters like `getViewLineMinColumn`. Option B briefly mentions resetting hidden areas when all lines hidden.
- **Actual approach:** Proactive invariant enforcement — ensure the 0-visible-lines state never persists by calling `_ensureAtLeastOneVisibleLine()` after construction and after `acceptVersionId`. Also fix the lower-level `ConstantTimePrefixSumComputer` and add event delivery resilience.
- **Assessment:** The proposal treats the symptom (crashing when 0 lines visible) while the actual fix treats the disease (preventing 0 visible lines from occurring). The proposal's Option B gestures toward the correct approach but lacks detail. The actual fix is architecturally superior — it maintains the invariant "≥1 visible line" so all downstream code can rely on it, rather than scattering guards everywhere.

## Alignment Score: 3/5 (Partial)

## Detailed Feedback

### What the proposal got right
- Correctly identified the exact root cause: all lines hidden in NES view model after content changes
- Correctly traced the crash path through `_toValidViewLineNumber` → `getViewLineInfo` → undefined access
- Correctly identified `viewModelImpl.ts` and `viewModelLines.ts` as relevant files
- Referenced the right contextual PRs (#292846, the existing setViewport guard)
- High confidence with solid reasoning backed by alexdima's comments and code analysis
- Option B was directionally correct (reset hidden areas when all lines hidden)

### What the proposal missed
- `prefixSumComputer.ts` — the `ConstantTimePrefixSumComputer` can't handle all-zero values or empty arrays, which is part of the crash path. The actual fix hardens this data structure.
- `textModel.ts` — event delivery resilience. One view model crashing shouldn't prevent other view models from receiving events. The actual fix wraps each `onDidChangeContentOrInjectedText` and `emitContentChangeEvent` call in try/catch.
- The insight that the `setViewport` guard from PR #287189 should be **reverted**, not kept. The actual fix removes it because the underlying invariant is now enforced.

### What the proposal got wrong
- The approach of scattering defensive guards in multiple methods is architecturally inferior to enforcing the invariant at the source. The actual fix adds a single `_ensureAtLeastOneVisibleLine()` method called from two places, rather than 5+ guards across the codebase.
- The proposal would keep the `setViewport` guard and add more like it, while the actual fix removes it — fundamentally different engineering philosophy (guard vs. prevent).
- The defensive getters in `viewModelLines.ts` (returning `1` or empty content when 0 lines visible) would mask the problem rather than fix it, potentially leading to subtle rendering bugs.

## Recommendations for Improvement
- When facing a "state should never happen" bug, prefer enforcing the invariant (preventing the bad state) over guarding against it (tolerating the bad state). The proposal's Option B was closer to this but needed more development.
- Consider lower-level data structures that may contribute to the crash. The `ConstantTimePrefixSumComputer` not handling edge cases was a key part of the fix.
- Consider error isolation — when multiple consumers process the same event, one failure shouldn't cascade. The try/catch in `textModel.ts` is a resilience pattern the proposal missed.
