# Bug Analysis: Issue #286336

## Understanding the Bug

When opening diff editors (especially side-by-side) and closing them, `DiffEditorWidget` instances leak and accumulate in memory. Heap snapshot comparison reveals N retained instances of `DiffEditorWidget` after N open/close cycles, when there should be at most 1 (kept cached in the editor group). The retainer chain points to `gutterFeature` → a `Map` of views in `EditorGutter` that are never disposed.

## Git History Analysis

### Time Window Used
- Initial: 24 hours
- Final: 24 hours (no expansion needed)

The file `src/vs/editor/browser/widget/diffEditor/utils/editorGutter.ts` was introduced by commit `dc178377f27` ("fix: memory leak call stack widget (#286246)") which created the file as part of a larger refactor. The `dispose()` method was written without cleaning up the `views` Map, introducing the leak from the start.

## Root Cause

The `EditorGutter` class maintains a `views: Map<string, ManagedGutterItemView>` that stores gutter item views. During rendering, unused views are properly disposed and removed from the map. However, when the `EditorGutter` itself is disposed (which happens when the diff editor is closed), the `dispose()` method only calls `super.dispose()` and `reset(this._domNode)` — it **never** iterates over `this.views` to dispose the remaining `ManagedGutterItemView` entries.

Each `ManagedGutterItemView` holds:
- `gutterItemView: IGutterItemView` (which implements `IDisposable`)
- `item: ISettableObservable<IGutterItemInfo>` (which holds references back to diff editor internals)

These undisposed views retain references to the `DiffEditorWidget` and its children through the observable chain, preventing garbage collection.

## Proposed Fix

### Option A: Targeted Fix (Recommended)

**Affected Files:**
- `src/vs/editor/browser/widget/diffEditor/utils/editorGutter.ts`

**Changes Required:**
Update the `dispose()` method to iterate over all entries in `this.views`, dispose each `gutterItemView`, remove its DOM node, and clear the map.

**Code Sketch:**
```typescript
override dispose(): void {
	super.dispose();

	for (const [_id, view] of this.views) {
		view.gutterItemView.dispose();
		view.domNode.remove();
	}
	this.views.clear();

	reset(this._domNode);
}
```

### Option B: Same Fix for Merge Editor Gutter

The merge editor has a nearly identical `EditorGutter` class at `src/vs/workbench/contrib/mergeEditor/browser/view/editorGutter.ts` with the same missing cleanup in `dispose()`. The same fix should be applied there as well for consistency, though it may not be as frequently triggered since merge editors are used less often.

## Confidence Level: High

## Reasoning

1. **Direct match to heap snapshot evidence:** The issue comments explicitly identify `gutterFeature` as the top retainer, and the Map in `EditorGutter` as the source. The `views` Map is the only Map in this class.

2. **Clear lifecycle gap:** The `render()` method has proper cleanup logic for unused views (lines at the bottom of render), but the `dispose()` method has no equivalent — this is a textbook lifecycle leak where cleanup only happens during re-render but not on final teardown.

3. **1-file fix matches metadata:** The PR metadata shows `fileCount: 1`, consistent with fixing just the diff editor's `editorGutter.ts`.

4. **Mental trace:** When a diff editor is closed → `DiffEditorWidget.dispose()` → its gutter `EditorGutter.dispose()` is called → `super.dispose()` stops the autorun that calls `render()` → `reset(this._domNode)` clears DOM children → but `this.views` Map still holds `ManagedGutterItemView` entries → these hold `IGutterItemView` instances that reference diff editor internals → GC cannot collect the `DiffEditorWidget`. With the fix, the views are explicitly disposed and the map is cleared, breaking the reference chain.
