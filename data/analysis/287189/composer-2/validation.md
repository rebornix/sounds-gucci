# Fix Validation: PR #287189

## Actual Fix Summary

The PR adds an early return in `ViewModel.setViewport`: when `_lines.getViewLineCount() === 0`, it skips `_viewportStart.update`, avoiding the code path that calls `getLineMinColumn` while there are no visible view lines.

### Files Changed

- `src/vs/editor/common/viewModel/viewModelImpl.ts` — guard at start of `setViewport` before `_viewportStart.update(this, startLineNumber)`.

### Approach

Fix at the call site: do not run viewport-start bookkeeping when the view has zero visible lines, so `ViewportStart.update` never triggers `getLineMinColumn` in the invalid state.

## Proposal Comparison

### Files Overlap

| Proposal | Actual | Match |
|----------|--------|-------|
| `viewModelLines.ts` (primary emphasis) | — | ❌ (not changed in PR) |
| `viewModelImpl.ts` / `ViewportStart.update` (optional / item 4) | `viewModelImpl.ts` | ✅ |

**Overlap Score:** 1/1 files actually changed in the PR were anticipated (1/1 = 100% of actual); the proposal also stressed a second file that the real fix did not modify.

### Root Cause Analysis

- **Proposal's root cause:** With zero visible view lines (e.g. all hidden), `_toValidViewLineNumber` / `getViewLineInfo` yield a bad index, `modelLineProjections[...]` is `undefined`, and `.getViewLineMinColumn` throws; stack includes `ViewportStart.update` → `getLineMinColumn`.
- **Actual root cause:** Same failure mode; the merged fix prevents entering `_viewportStart.update` when `getViewLineCount() === 0`, which avoids that crash path.
- **Assessment:** ✅ Correct

### Approach Comparison

- **Proposal's approach:** Multi-layer hardening (empty-view guards in `getViewLine*`, `_toValidViewLineNumber`, defensive projection checks, plus viewport-level skip of `getLineMinColumn` when line count is 0).
- **Actual approach:** Single, minimal guard in `setViewport` only.
- **Assessment:** The shipped change matches the proposal’s viewport-level idea (avoid querying min column / viewport update when there are no visible lines). It is a subset of Option A and does not implement the `viewModelLines.ts` edits the proposal treated as primary.

## Alignment Score: 4/5 (Good)

## Detailed Feedback

### What the proposal got right

- Correctly traced the error to `getViewLineMinColumn` / `modelLineProjections` and the zero–view-line / hidden-range scenario.
- Correctly tied `ViewportStart.update` and `getLineMinColumn` to the stack.
- Named `viewModelImpl.ts` and described guarding when there are no lines before the hazardous viewport path—aligned with the actual early return in `setViewport` (using `getViewLineCount() === 0`).

### What the proposal missed

- Did not predict that the maintainers would fix the bug with **only** the `setViewport` guard and **no** changes under `viewModelLines.ts`.
- Suggested `getLineCount()` in one place where the real fix uses `getViewLineCount()` on `_lines`.

### What the proposal got wrong

- Nothing materially wrong about the root cause; the main gap is **scope**: over-weighting `viewModelLines.ts` as the primary change vs. the minimal `viewModelImpl` fix that landed.

## Recommendations for Improvement

- After identifying a crash inside `viewModelLines`, also search for the smallest caller guard (e.g. `setViewport` / viewport update) that can avoid the bad state, and treat that as a first-class fix path when it matches telemetry stacks.
- Prefer verifying whether an early exit at the public API (`setViewport`) is sufficient before recommending broader edits across all `getViewLine*` accessors.
