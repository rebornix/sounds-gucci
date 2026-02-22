# Bug Analysis: Issue #212713

## Understanding the Bug

The error telemetry reports a `Model is disposed!` error with this stack trace:

```
Error: Model is disposed!
  at V.ib in src/vs/editor/common/model/textModel.ts:416:10
  at V.validateRange in src/vs/editor/common/model/textModel.ts:1062:8
  at V.tb in src/vs/editor/common/model/textModel.ts:1251:9
  at V.ub in src/vs/editor/common/model/textModel.ts:1262:21
  at V.applyEdits in src/vs/editor/common/model/textModel.ts:1416:28
  at i.$onVirtualDocumentChange in src/vs/workbench/api/browser/mainThreadDocumentContentProviders.ts:88:11
```

The crash occurs in `$onVirtualDocumentChange` when calling `model.applyEdits()` on a model that has already been disposed.

## Git History Analysis

### Time Window Used
- Initial: 24 hours
- Final: 24 hours (no expansion needed)

A recent commit `01158412d0a` ("make it consistent (#280902)") rewrote the file but did not introduce the race condition — the pattern existed before. The race condition is inherent to the async flow.

## Root Cause

The `$onVirtualDocumentChange` method in `mainThreadDocumentContentProviders.ts` has a classic async race condition:

1. **Line 63**: The model is obtained via `this._modelService.getModel()` and null-checked at line 64 — correct so far.
2. **Line 77**: `await this._editorWorkerService.computeMoreMinimalEdits(...)` is called — this yields execution.
3. **During the await**, the model can be disposed (e.g., the document tab is closed, extension host restarts, etc.).
4. **Line 82-84**: After the await, only the cancellation token is checked — the model's disposal state is NOT checked.
5. **Line 88**: `model.applyEdits(...)` is called on the now-disposed model, which internally calls `validateRange()`, which calls the disposal guard (`_assertNotDisposed`), throwing `"Model is disposed!"`.

The cancellation token only guards against a *newer update superseding this one* — it does not guard against the model being disposed during the async gap.

## Proposed Fix

### Option A: Targeted Fix (Recommended)

**Affected Files:**
- `src/vs/workbench/api/browser/mainThreadDocumentContentProviders.ts`

**Changes Required:**
Add a `model.isDisposed()` check after the `await` returns, alongside the existing cancellation check.

**Code Sketch:**
```typescript
// In $onVirtualDocumentChange, after the await and cancellation check:

if (myToken.token.isCancellationRequested) {
    // ignore this
    return;
}

// Guard against model being disposed during the async computeMoreMinimalEdits call
if (model.isDisposed()) {
    return;
}

if (edits && edits.length > 0) {
    // use the evil-edit as these models show in readonly-editor only
    model.applyEdits(edits.map(edit => EditOperation.replace(Range.lift(edit.range), edit.text)));
}
```

The `ITextModel` interface exposes `isDisposed(): boolean` (defined at `model.ts:942`, implemented at `textModel.ts:620`), making this a single-line guard.

### Option B: Re-fetch model after await

An alternative is to re-fetch the model after the await instead of relying on the stale reference:

```typescript
const edits = await this._editorWorkerService.computeMoreMinimalEdits(model.uri, [...]);

this._pendingUpdate.delete(model.id);

if (myToken.token.isCancellationRequested) {
    return;
}

// Re-fetch model to ensure it's still alive
const freshModel = this._modelService.getModel(URI.revive(uri));
if (!freshModel) {
    return;
}

if (edits && edits.length > 0) {
    freshModel.applyEdits(edits.map(edit => EditOperation.replace(Range.lift(edit.range), edit.text)));
}
```

This is more defensive but slightly more complex. Option A is simpler and sufficient since `isDisposed()` is the idiomatic check in the codebase.

## Confidence Level: High

## Reasoning

1. **The stack trace is unambiguous**: `model.applyEdits()` throws `Model is disposed!`, and the only call to `model.applyEdits()` in this method is at line 88.
2. **The async gap is the only window**: Between obtaining the model (line 63, where it passes the null check) and using it (line 88), the only thing that can change the model's state is the `await` on line 77. During this await, any number of other events can dispose the model.
3. **The existing cancellation check doesn't cover disposal**: The `myToken` cancellation check (line 82) guards against *newer virtual document updates* superseding this one, not against model disposal.
4. **`isDisposed()` is the standard pattern**: The codebase uses `model.isDisposed()` checks after async operations extensively (e.g., in editor contributions and model-related services).
5. **Minimal and safe**: Adding a single `if (model.isDisposed()) { return; }` guard is the smallest possible fix that eliminates the race window. If the model is disposed, there's no point applying edits — the document is gone.
