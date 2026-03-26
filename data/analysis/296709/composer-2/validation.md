# Fix Validation: PR #296709

## Actual Fix Summary

The PR fixes the `getViewLineMinColumn` / view-mapping crash when **all model lines can end up with zero visible view lines** (hidden areas, edits, undo, tab-size changes, merged hidden ranges). It combines: (1) **`ConstantTimePrefixSumComputer`** — safe `getIndexOf` when the sum has no direct index (including empty / all-zero totals) and correct `_indexBySum` sizing when values are empty; (2) **`ViewModelLinesFromProjectedModel`** — `_ensureAtLeastOneVisibleLine()` after construction and on `acceptVersionId`, forcing the first projection visible and updating prefix sums when `getViewLineCount() === 0`; (3) **`TextModel`** — `try`/`catch` around `onDidChangeContentOrInjectedText` and `emitContentChangeEvent` per view model so one failing VM does not block others; (4) **`ViewModel.setViewport`** — removes the early return when `getViewLineCount() === 0`; (5) extensive **tests** for hidden-area edge cases and prefix-sum parity.

### Files Changed

- `src/vs/editor/common/model/prefixSumComputer.ts` — `getIndexOf` fallback when `idx === undefined`; empty-array `_indexBySum.length`
- `src/vs/editor/common/model/textModel.ts` — isolate errors when notifying view models of content/injected-text changes
- `src/vs/editor/common/viewModel/viewModelImpl.ts` — always run `setViewport` / `_viewportStart.update` (drop zero-line early exit)
- `src/vs/editor/common/viewModel/viewModelLines.ts` — `_ensureAtLeastOneVisibleLine()`; call from constructor and `acceptVersionId` (replaces narrower single-line hidden reset)
- `src/vs/editor/test/browser/viewModel/viewModelImpl.test.ts` — suite for “at least one visible line” scenarios
- `src/vs/editor/test/common/viewModel/prefixSumComputer.test.ts` — expanded coverage including `ConstantTimePrefixSumComputer`

### Approach

Enforce an **invariant** (never zero visible view lines when projections exist), **harden prefix-sum queries** used by line mapping, and **contain failures** across attached view models—rather than only adding defensive returns at every column API.

## Proposal Comparison

### Files Overlap

| Proposal | Actual | Match |
|----------|--------|-------|
| `viewModelLines.ts` | `viewModelLines.ts` | ✅ |
| `viewModelImpl.ts` | `viewModelImpl.ts` | ✅ |
| (optional / “possibly” other integration files) | `textModel.ts` | ⚠️ (concept: event propagation; not named as concrete file) |
| — | `prefixSumComputer.ts` | ❌ (missed) |
| — | `*test.ts` | ❌ (expected for benchmark) |

**Overlap Score:** 2/4 production files named in the proposal vs changed in the PR (50%); all core view-model files in the actual fix were at least partially anticipated.

### Root Cause Analysis

- **Proposal's root cause:** Zero visible view lines → invalid prefix-sum / `getViewLineInfo` path → `modelLineProjections[...]` undefined; secondary issues with multi–view-model updates and re-entrancy during edits/decorations.
- **Actual root cause:** Same underlying failure class: zero view-line count and inconsistent mapping, plus fragile `ConstantTimePrefixSumComputer` behavior for sums without a direct index; one view model throwing could break notification to others.
- **Assessment:** ✅ Correct — matches maintainer thread (all lines hidden, NES/hidden areas, interaction with change delivery).

### Approach Comparison

- **Proposal's approach:** Central guards when `getViewLineCount() === 0`, safe defaults for min/max column, verify projection before delegate, adjust `_toValidViewLineNumber` / `getViewLineInfo` pairing, audit event propagation.
- **Actual approach:** Guarantee at least one visible line via `_ensureAtLeastOneVisibleLine`, fix prefix-sum indexing for edge sums, per–view-model `try`/`catch` in `TextModel`, remove `setViewport` short-circuit on zero lines.
- **Assessment:** Same problem, **different mechanics**. Defensive getters (proposal) could mitigate crashes; the shipped fix prefers **structural invariants + data-structure hardening + error isolation**. The proposal did **not** call out `prefixSumComputer.ts` or explicit `try`/`catch` in `textModel.ts`.

## Alignment Score: 4/5 (Good)

## Detailed Feedback

### What the proposal got right

- Correct diagnosis of **zero visible view lines** and the link to **`getViewLineMinColumn` / projection undefined** behavior.
- Correct identification of **`viewModelLines.ts`** and **`viewModelImpl.ts`** as central.
- Awareness of **multi–view-model / `onDidChangeContentOrInjectedText`** as part of the story (aligns with `TextModel` changes in the actual PR).
- Code sketch for **`getViewLineMinColumn`** guards matches the *symptom* the stack traces show, even though the PR chose invariant + prefix-sum fixes instead.

### What the proposal missed

- **`prefixSumComputer.ts`** — a major part of the real fix (`getIndexOf` / empty `_indexBySum` behavior).
- Explicit **`textModel.ts`** per–view-model **`try`/`catch`** (isolation), not just a generic “audit propagation.”
- **`setViewport`**: the PR **removed** the early return when line count was 0; the proposal leaned toward more early exits / clamping elsewhere rather than this specific change.

### What the proposal got wrong

- Nothing **fundamentally wrong** about the bug story; the main gap is **incomplete file scope** and **implementation strategy** (guards everywhere vs enforced visibility + prefix-sum + isolation).

## Recommendations for Improvement

- Trace **`ConstantTimePrefixSumComputer` / `getIndexOf`** from `getViewLineInfo` when investigating `getViewLineMinColumn` telemetry, not only `ViewModelLines` call sites.
- When multiple view models attach to one model, consider **`TextModel`** notification loops as a place for **isolation** (try/finally or try/catch per listener) if stacks show cascading failures.
- Distinguish **“always return safe defaults when count is 0”** from **“restore invariant so count is not 0”**—the latter is what this PR implemented.
