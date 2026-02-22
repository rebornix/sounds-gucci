# Bug Analysis: Issue #286336

## Understanding the Bug
The issue reports a memory leak when repeatedly opening a side-by-side diff editor and closing all editors. Heap snapshots show retained `DiffEditorWidget` instances growing over iterations (beyond the expected single cached instance).

Issue comments provide strong localization clues:
- retainers repeatedly include `gutterFeature`
- maintainers mention a map of gutter views that are never disposed
- this issue appears retrospective (`"an actual leak of editor gutter: ... #286385"` is referenced in comments), but we can still independently validate the likely location from code state at the parent commit.

## Git History Analysis
Relevant findings at parent commit `2294cd06ff23310d8ac282c40654a0f0f7e700d4`:

- `src/vs/editor/browser/widget/diffEditor/utils/editorGutter.ts` exists and is fully attributed by `git blame` to commit `dc178377f27`.
- `git log` for this file up to parent shows:
  - `dc178377f27 fix: memory leak call stack widget (#286246)`
- In that implementation, `EditorGutter` stores created gutter item views in `this.views: Map<string, ManagedGutterItemView>`.

### Time Window Used
- Initial: 24 hours
- Final: 24 hours (no expansion needed for root-cause confidence)

## Root Cause
`EditorGutter.dispose()` in `src/vs/editor/browser/widget/diffEditor/utils/editorGutter.ts` does not dispose entries in `this.views`.

Current dispose behavior:
- calls `super.dispose()`
- resets gutter DOM node (`reset(this._domNode)`)

What is missing:
- iterating over `this.views` and disposing each `gutterItemView`
- clearing/removing map entries

Why that leaks:
- each `IGutterItemView` (e.g. diff toolbar view created via `gutterFeature`) registers observables/listeners and keeps references to diff editor state
- when editor closes, DOM reset alone removes nodes but does not run disposers in these view instances
- retained view objects in `this.views` keep the diff editor object graph alive, matching heap retainer observations (`gutterFeature` / map of views)

## Proposed Fix

### Option A: Targeted Fix (Recommended)
**Affected Files:**
- `src/vs/editor/browser/widget/diffEditor/utils/editorGutter.ts`

**Changes Required:**
Add explicit cleanup of all managed gutter item views inside `EditorGutter.dispose()` before/around DOM reset:
1. iterate `this.views.values()`
2. call `view.gutterItemView.dispose()` for each
3. optionally `view.domNode.remove()` (safe)
4. `this.views.clear()`
5. keep existing `reset(this._domNode)`

This is the smallest change that directly breaks the retention chain.

**Code Sketch:**
```ts
override dispose(): void {
	super.dispose();

	for (const view of this.views.values()) {
		view.gutterItemView.dispose();
		view.domNode.remove();
	}
	this.views.clear();

	reset(this._domNode);
}
```

### Option B: Comprehensive Fix (Optional)
Also apply the same disposal hardening to the similar utility in merge editor:
- `src/vs/workbench/contrib/mergeEditor/browser/view/editorGutter.ts`

Trade-off:
- broader safety against the same lifecycle bug pattern
- larger scope than strictly needed for the reported diff-editor leak

## Confidence Level: High

## Reasoning
- Repro path is side-by-side diff editor.
- The diff editor gutter code (`gutterFeature` -> `EditorGutter`) is directly in that path.
- The code clearly stores disposable view objects in a map and only disposes them when they scroll out (`unusedIds` cleanup), not when the whole gutter/editor is disposed.
- Heap comments from maintainers align exactly with this pattern (retainer in `gutterFeature`, map of views not disposed).
- A targeted dispose-time cleanup resolves the lifecycle gap without changing rendering logic.
