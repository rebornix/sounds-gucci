# Bug Analysis: Issue #212713

## Understanding the Bug

Telemetry reports `Error: Model is disposed!` thrown from `TextModel._assertNotDisposed` during `validateRange` → `applyEdits`. The stack shows the call path:

- `MainThreadDocumentContentProviders.$onVirtualDocumentChange` applies edits after an async step
- `textModel.ts` — disposed models must not receive edits

So a virtual document’s text model is being updated after something has already disposed that model.

## Git History Analysis

No commits touched `mainThreadDocumentContentProviders.ts` in the 7-day window before the parent commit; the regression is best explained as an inherent race in the async update path rather than a very recent local change.

### Time Window Used

- Initial: 24 hours  
- Final: 7 days (no file-specific commits found; expanded for context)

## Root Cause

In `$onVirtualDocumentChange`, the code:

1. Resolves `model` via `_modelService.getModel(uri)`
2. Awaits `_editorWorkerService.computeMoreMinimalEdits(...)` (async worker)
3. After the await, applies edits with `model.applyEdits(...)`

Between (2) and (3), the model can be closed/disposed (e.g. editor closed, document released, provider unregistered). The captured `model` reference is stale; `applyEdits` runs validation on a disposed `TextModel`, which throws `BugIndicatingError('Model is disposed!')`.

Cancellation only guards `_pendingUpdate` / token; it does not prevent disposal from other lifecycles.

## Proposed Fix

### Option A: Targeted Fix (Recommended)

**Affected Files:**

- `src/vs/workbench/api/browser/mainThreadDocumentContentProviders.ts`

**Changes Required:**

After `computeMoreMinimalEdits` resolves (and after removing the pending token and checking cancellation), verify the model is still usable before calling `applyEdits`:

- If `ITextModel.isDisposed()` is true, return early (no edits).
- Optionally, re-resolve via `_modelService.getModel(URI.revive(uri))` and ensure the instance matches the one you started with (or at least non-null and not disposed), so you never apply to a disposed or replaced model.

**Code Sketch:**

```typescript
// After await computeMoreMinimalEdits, after _pendingUpdate.delete and cancellation check:
if (model.isDisposed()) {
	return;
}
const current = this._modelService.getModel(URI.revive(uri));
if (!current || current !== model || current.isDisposed()) {
	return;
}
if (edits && edits.length > 0) {
	model.applyEdits(/* ... */);
}
```

### Option B: Comprehensive Fix (Optional)

Register a disposable listener on `model.onWillDispose` to cancel the pending `CancellationTokenSource` for that update, reducing wasted worker work. Still keep the post-await disposed check as the authoritative guard.

## Confidence Level: High

## Reasoning

The stack trace pins the failure to applying edits on a `TextModel` after disposal. The only async boundary in `$onVirtualDocumentChange` before `applyEdits` is `computeMoreMinimalEdits`; that is the natural race window. Guarding `applyEdits` with `isDisposed()` (and consistency with `getModel`) matches the symptom and avoids touching editor core behavior.
