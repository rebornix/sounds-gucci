# Bug Analysis: Issue #293365

## Understanding the Bug

Same class of failure as other `getViewLineMinColumn` telemetry: `Cannot read properties of undefined (reading 'getViewLineMinColumn')` (and related messages like `getModelColumnOfViewPosition`, `normalizePosition`, `then` depending on minified layout). Stacks show it during typing, cut, visible-range queries, `deltaDecorations` / marker updates, and `onDidChangeContentOrInjectedText` — often with Copilot inline suggestions, SCM diff editors, or NES-style experiences.

**Maintainer debug note (@alexdima):** a view model had **all lines invisible** (hidden areas masking most of the file), typical of **NES view models** (side-by-side / jump). That long-standing edge case became critical combined with another regression where a **broken view model could prevent other view models from receiving change events** (see linked PR #292846 in the thread).

## Git History Analysis

No commits in the 7-day window before the parent commit touched `viewModelLines.ts` / `viewModelImpl.ts`; the fix is behavioral hardening and related wiring rather than a very recent regression in those files alone.

### Time Window Used

- Initial: 24 hours → expanded to 7 days (no hits)

## Root Cause

1. **Zero visible view lines:** When every model line is hidden (hidden-area decorations), each projection’s `getViewLineCount()` is `0`, so `projectedModelLineLineCounts.getTotalSum()` is `0`. `_toValidViewLineNumber` clamps any positive view line down to `0`, then `getViewLineInfo` calls `getIndexOf(viewLineNumber - 1)` with `-1`, producing an invalid `ViewLineInfo` and `modelLineProjections[...]` is `undefined`. Any `getViewLineMinColumn` / content / range query then throws.

2. **Re-entrancy / multi–view-model:** User reports and stacks show failures while `pushEditOperations` / `deltaDecorations` / injected-text updates run. A secondary view model (ghost text, NES, diff) can query visible ranges or columns while the line mapping is in an inconsistent or all-hidden state, or miss updates and stay stale relative to the model.

## Proposed Fix

### Option A: Targeted Fix (Recommended)

**Affected Files (expected scope from PR title and stacks):**

- `src/vs/editor/common/viewModel/viewModelLines.ts` — all methods that use `getViewLineInfo` then index `modelLineProjections[info.modelLineNumber - 1]`
- `src/vs/editor/common/viewModel/viewModelImpl.ts` — call sites that assume at least one visible view line (`ViewportStart.update`, `getCompletelyVisibleViewRange`, `getModelVisibleRanges`, `_handleVisibleLinesChanged`, `onDidChangeContentOrInjectedText`)
- Possibly additional editor / NES / ghost-text integration files (PR lists 6 files) to ensure **content-change events reach every view model** attached to the same document and that dependent UI does not run layout queries against an all-hidden mapping without guards.

**Changes Required:**

1. **Central guard:** If `getViewLineCount() === 0`, define consistent behavior: return safe defaults (`minColumn`/`maxColumn` = `1`, empty strings for content where appropriate) and skip prefix-sum `getIndexOf` with invalid sums.

2. **Projection access:** Before delegating to `line.getViewLineMinColumn` (etc.), verify `line` is defined; if not, return `1` or no-op as appropriate.

3. **`_toValidViewLineNumber`:** Do not produce `0` when `viewLineCount === 0` in a way that leads to `getIndexOf(-1)`; pair clamping with early exits in `getViewLineInfo` / public getters.

4. **Event propagation:** Audit `onDidChangeContentOrInjectedText` / decoration flush paths so one view model’s broken or flushing state does not suppress updates others need (aligns with #292846 discussion).

**Code Sketch (same pattern as minimal hardening):**

```typescript
public getViewLineMinColumn(viewLineNumber: number): number {
	if (this.getViewLineCount() === 0) {
		return 1;
	}
	const info = this.getViewLineInfo(viewLineNumber);
	const line = this.modelLineProjections[info.modelLineNumber - 1];
	if (!line) {
		return 1;
	}
	return line.getViewLineMinColumn(this.model, info.modelLineNumber, info.modelLineWrappedLineIdx);
}
```

### Option B: Comprehensive Fix (Optional)

- Ensure hidden-area setup for NES never leaves **zero** visible lines for a view model that still participates in editing (e.g. always keep a sentinel visible region), **or** explicitly disable column/range queries for that mode.
- Add integration tests: all lines hidden + typing + injected text + second editor reading visible ranges.

## Confidence Level: High

## Reasoning

The issue thread includes an explicit engineering diagnosis (all lines invisible, NES, interaction with change-event delivery). That matches the known `getViewLineCount() === 0` failure mode in `ViewModelLines`. Hardening those APIs plus fixing cross–view-model update ordering addresses both the immediate `undefined` crash and the “weird editor / undo” symptoms users described.
