# Bug Analysis: Issue #293365

## Understanding the Bug

The error `Cannot read properties of undefined (reading 'getViewLineMinColumn')` is a high-impact crash (674K hits, 54.5K affected users) occurring across all platforms when users type or cut text in the editor. Multiple related errors hit the same root cause — accessing properties on `undefined` at the same call site in the view model lines.

**Key observations from issue comments:**
- @alexr00 posted four related stack traces, all crashing at `getViewLineMinColumn` through different callers
- @langningchen and @yamachu correlated the issue with GitHub Copilot inline suggestions being active
- @yamachu reported it happening in the SCM diff editor
- @pjm4 reported it breaks undo and causes cursor to stop moving
- @alexdima's debugging revealed: **"the problem was that there was a view model which had all lines invisible (i.e. like folded away). I believe it was one of the NES view models (the side-by-side one or the jump one) where hidden areas are used to mask the majority of the file."**
- @alexdima also linked this to PR #292846, noting that "a broken view model can cause other view models to not see change events"

## Git History Analysis

### Time Window Used
- Initial: 24 hours
- Final: 7 days (expanded to find PR #292846 context)

### Key Commits

**PR #292846** (`38f162654ff`) — "Make the view models known to the text models to ensure all events are processed immediately"
- Already merged before the parent commit
- Changed how view models receive model events — now via direct registration (`model.registerViewModel(this)`)
- In `textModel._onDidChangeContentOrInjectedText()`, ALL registered view models process content changes immediately
- This means NES/inline-edit view models with heavily hidden lines now receive and process content change events in lockstep

**Existing guard in `setViewport`** (viewModelImpl.ts line 784-787):
```ts
if (this._lines.getViewLineCount() === 0) {
    // No visible lines to set viewport on
    return;
}
```
This guard exists for `setViewport` but similar guards are **missing** from `_handleVisibleLinesChanged`, `getModelVisibleRanges`, `getCompletelyVisibleViewRange`, `visibleLinesStabilized`, and `getVisibleRangesPlusViewportAboveBelow`.

**Existing guard in `setHiddenAreas`** (viewModelLines.ts line 246):
```ts
if (!hasVisibleLine) {
    // Cannot have everything be hidden => reveal everything!
    this.setHiddenAreas([]);
}
```
This only runs when `setHiddenAreas` is explicitly called — it does **not** run after `onModelLinesDeleted` or `onModelLineChanged`.

## Root Cause

After PR #292846, when text model content changes (typing, cutting, decoration changes), every registered view model's `onDidChangeContentOrInjectedText` is called directly by the text model. For NES (Next Edit Suggestions) inline edit view models that use hidden areas to mask most of the file (e.g., `inlineEditsSideBySideView.ts` hides everything except the edit region), there is a window where:

1. The model content changes (lines deleted/inserted by the main editor edit)
2. The NES view model processes the change via `onModelLinesDeleted`/`onModelLinesInserted`, which updates projections but does **not** recalculate hidden areas
3. After processing, `_handleVisibleLinesChanged()` is called
4. This calls `getModelVisibleRanges()` → `getLineMinColumn()` → `_lines.getViewLineMinColumn()`
5. Inside `getViewLineMinColumn`, `_toValidViewLineNumber(n)` returns `0` because `getViewLineCount()` is `0` (all lines hidden)
6. `getViewLineInfo(0)` calls `projectedModelLineLineCounts.getIndexOf(-1)` returning an invalid index
7. `this.modelLineProjections[info.modelLineNumber - 1]` is `undefined` → **crash**

The same crash path triggers through:
- Decoration changes (diagnostic markers) → `handleBeforeFireDecorationsChangedEvent` → `_onDidChangeContentOrInjectedText`
- Edit operations (type/cut) → `_doApplyEdits` → `_emitContentChangedEvent` → `_onDidChangeContentOrInjectedText`

## Proposed Fix

### Option A: Targeted Fix (Recommended)

**Affected Files:**
- `src/vs/editor/common/viewModel/viewModelImpl.ts`
- `src/vs/editor/common/viewModel/viewModelLines.ts`

**Changes Required:**

1. **Guard in `ViewModelImpl._handleVisibleLinesChanged`** — early return when there are no visible view lines, matching the existing pattern in `setViewport`:

```typescript
private _handleVisibleLinesChanged(): void {
    if (this._lines.getViewLineCount() === 0) {
        // No visible lines to report
        return;
    }
    const modelVisibleRanges = this.getModelVisibleRanges();
    this._attachedView.setVisibleLines(modelVisibleRanges, false);
}
```

2. **Guard in `ViewModelImpl.visibleLinesStabilized`** — same pattern:

```typescript
public visibleLinesStabilized(): void {
    if (this._lines.getViewLineCount() === 0) {
        return;
    }
    const modelVisibleRanges = this.getModelVisibleRanges();
    this._attachedView.setVisibleLines(modelVisibleRanges, true);
}
```

3. **Guard in `ViewModelImpl.getCompletelyVisibleViewRange`** — return an empty range:

```typescript
public getCompletelyVisibleViewRange(): Range {
    if (this._lines.getViewLineCount() === 0) {
        return new Range(1, 1, 1, 1);
    }
    const partialData = this.viewLayout.getLinesViewportData();
    // ... existing code
}
```

4. **Guard in `ViewModelImpl.getVisibleRangesPlusViewportAboveBelow`**:

```typescript
public getVisibleRangesPlusViewportAboveBelow(): Range[] {
    if (this.getLineCount() === 0) {
        return [];
    }
    // ... existing code
}
```

5. **Defensive guard in `ViewModelLinesFromProjectedModel`** — protect `getViewLineMinColumn` and similar methods against the undefined access in case callers bypass the higher-level guards:

```typescript
public getViewLineMinColumn(viewLineNumber: number): number {
    if (this.getViewLineCount() === 0) {
        return 1;
    }
    const info = this.getViewLineInfo(viewLineNumber);
    return this.modelLineProjections[info.modelLineNumber - 1].getViewLineMinColumn(
        this.model, info.modelLineNumber, info.modelLineWrappedLineIdx
    );
}
```

Apply the same pattern to `getViewLineContent`, `getViewLineLength`, `getViewLineMaxColumn`, and `getViewLineData`.

### Option B: Comprehensive Fix

In addition to Option A, also fix the underlying issue by re-checking hidden areas after model content changes. In `ViewModelImpl.onDidChangeContentOrInjectedText`, after processing all changes, check if all lines became hidden and if so, reset hidden areas:

```typescript
// After processing changes, ensure we don't have all lines hidden
if (this._lines.getViewLineCount() === 0) {
    // All lines are hidden due to a model change, reset hidden areas
    this._lines.setHiddenAreas([]);
    // Re-emit flush event since line mappings changed
    // ...
}
```

This is a more involved change as it needs to properly handle the event emission and line mapping updates.

## Confidence Level: High

## Reasoning

1. **The error is clearly explained by alexdima**: all lines hidden in a NES view model, exacerbated by PR #292846's direct event delivery.

2. **The existing guard in `setViewport` (line 784)** confirms that `getViewLineCount() === 0` is a known edge case that needs handling — it's just been missed in `_handleVisibleLinesChanged` and related methods.

3. **The crash path is deterministic**: `_toValidViewLineNumber` returns 0 when `viewLineCount` is 0, and `getViewLineInfo(0)` accesses `projectedModelLineLineCounts.getIndexOf(-1)` which returns a garbage index, causing `this.modelLineProjections[index]` to be `undefined`.

4. **Mental trace verification**: If we add the guard to `_handleVisibleLinesChanged` to return early when `getViewLineCount() === 0`, the crash path at `_handleVisibleLinesChanged → getModelVisibleRanges → getLineMinColumn → getViewLineMinColumn` is eliminated. The subsequent `setHiddenAreas` call (triggered by NES or folding) will fix the state when it recalculates with the updated model. The defensive guards in `viewModelLines.ts` catch any remaining callers that might reach the code path through view event listeners fired during `endEmitViewEvents`.

5. **Pattern matches Copilot/NES correlation**: Users report the issue with Copilot inline suggestions active, which creates NES preview editors that use `setHiddenAreas` to hide most of the file — exactly the scenario alexdima described.
