# Bug Analysis: Issue #212713

## Understanding the Bug
Telemetry reports `Error: Model is disposed!` thrown from `TextModel._assertNotDisposed` during `model.applyEdits(...)`.

The stack points to:
- `src/vs/workbench/api/browser/mainThreadDocumentContentProviders.ts` (`$onVirtualDocumentChange`)
- `src/vs/editor/common/model/textModel.ts` (`validateRange`/`applyEdits` path)

The failing flow is an async virtual-document update: a model is captured, `computeMoreMinimalEdits` is awaited, and then edits are applied. If the model gets disposed while awaiting, the later `applyEdits` throws.

## Git History Analysis
- `git blame` on `mainThreadDocumentContentProviders.ts` lines around `$onVirtualDocumentChange` attributes the method to commit `01158412d0a` (`make it consistent (#280902)`, 2025-12-03), which introduced this async update implementation.
- The issue is consistent with a race introduced by this pattern: capture model -> await async computation -> use model without re-validating lifecycle.
- The parent commit for this benchmark is `5a6cdd0697cbeaadf0fff04abe4855e00b813e75`.

### Time Window Used
- Initial: 24 hours
- Final: 168 hours (expanded 2 times)
- Notes: direct `git log --since/--until` around the parent commit in this local clone was sparse, so I used file-level blame and targeted commit inspection to identify the introducing change.

## Root Cause
`$onVirtualDocumentChange` stores a live `ITextModel` reference, awaits `computeMoreMinimalEdits`, and then calls `model.applyEdits(...)` without verifying the model is still alive.

If the editor/document is closed (or otherwise disposed) during the await, `applyEdits` executes on a disposed model and throws `Model is disposed!`.

## Proposed Fix

### Option A: Targeted Fix (Recommended)
**Affected Files:**
- `src/vs/workbench/api/browser/mainThreadDocumentContentProviders.ts`
- `src/vs/workbench/api/test/browser/mainThreadDocumentContentProviders.test.ts`

**Changes Required:**
1. In `$onVirtualDocumentChange`, after awaiting `computeMoreMinimalEdits` and cancellation checks, add a disposal guard before applying edits.
2. Add a regression test that disposes the model while `computeMoreMinimalEdits` is pending, asserting no exception is surfaced and no edits are applied to a disposed model.

**Code Sketch:**
```ts
async $onVirtualDocumentChange(uri: UriComponents, value: string): Promise<void> {
	const model = this._modelService.getModel(URI.revive(uri));
	if (!model) {
		return;
	}

	const pending = this._pendingUpdate.get(model.id);
	pending?.cancel();

	const myToken = new CancellationTokenSource();
	this._pendingUpdate.set(model.id, myToken);

	try {
		const edits = await this._editorWorkerService.computeMoreMinimalEdits(model.uri, [
			{ text: value, range: model.getFullModelRange() }
		]);

		this._pendingUpdate.delete(model.id);

		if (myToken.token.isCancellationRequested || model.isDisposed()) {
			return;
		}

		if (edits && edits.length > 0) {
			model.applyEdits(edits.map(edit => EditOperation.replace(Range.lift(edit.range), edit.text)));
		}
	} catch (error) {
		onUnexpectedError(error);
	}
}
```

### Option B: Comprehensive Fix (Optional)
Use URI-based tracking (instead of model-id-only) and/or a `finally` block to always clean up/`dispose` pending cancellation tokens, improving resilience and reducing stale-token risk in additional failure modes.

Trade-off: more code and behavior change surface than needed to fix the reported telemetry regression.

## Confidence Level: High

## Reasoning
- The stack trace directly matches the only unguarded `model.applyEdits` call in the virtual document update path.
- The code already anticipates async races via cancellation tokens, but it does not guard disposal after `await`.
- Adding `model.isDisposed()` at the use site is the minimal and correct fix for this specific symptom.
- A focused regression test in `mainThreadDocumentContentProviders.test.ts` can deterministically validate the race and prevent recurrence.