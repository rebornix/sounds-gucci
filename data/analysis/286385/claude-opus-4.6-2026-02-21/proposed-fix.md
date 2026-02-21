# Bug Analysis: Issue #286336

## Understanding the Bug

When opening diff editors (e.g., "Select for Compare" + "Compare with" in the explorer, then splitting the diff editor), then closing all editors, `DiffEditorWidget` instances and related objects accumulate in memory and are never garbage collected. The leak grows with each open/close cycle — N cycles produce N retained `DiffEditorWidget` instances.

The reporter identified `gutterFeature` as the top retainer in heap snapshot comparisons. Maintainer @bpasero confirmed that a `Map` of views in `EditorGutter` holds onto the diff editor widget through views that are never disposed.

## Git History Analysis

### Time Window Used
- Initial: 24 hours
- Final: 7 days (expanded once to check for related changes)

### Relevant Commits

- **`dc178377f27`** (Jan 7, 2026) — "fix: memory leak call stack widget (#286246)"
  - This commit **created** `src/vs/editor/browser/widget/diffEditor/utils/editorGutter.ts` as a new file, likely extracted from another location during a related memory leak fix.
  - The newly created file already had the incomplete `dispose()` method that causes this bug.

No other recent commits modified the relevant file. The bug was present from the moment the file was created/extracted.

## Root Cause

The `EditorGutter` class maintains a `Map<string, ManagedGutterItemView>` called `views` that caches gutter item views (specifically `DiffToolBar` instances in the diff editor use case).

During rendering, unused views are properly cleaned up:
```typescript
// In render() — unused views are disposed
for (const id of unusedIds) {
    const view = this.views.get(id)!;
    view.gutterItemView.dispose();
    view.domNode.remove();
    this.views.delete(id);
}
```

However, when the `EditorGutter` itself is disposed (e.g., when the diff editor is closed), the `dispose()` method **never** cleans up the remaining views in the map:

```typescript
override dispose(): void {
    super.dispose();
    reset(this._domNode);  // Only resets DOM, doesn't dispose views!
}
```

The remaining `ManagedGutterItemView` instances hold references to `DiffToolBar` (which implements `IGutterItemView`), and `DiffToolBar` holds references to the diff editor's `DiffEditorGutter`, which in turn holds the `DiffEditorViewModel` and other diff editor infrastructure — creating a retention chain that prevents garbage collection of the entire diff editor widget graph.

## Proposed Fix

### Option A: Targeted Fix (Recommended)

**Affected Files:**
- `src/vs/editor/browser/widget/diffEditor/utils/editorGutter.ts`

**Changes Required:**
Add view disposal logic to the `dispose()` method of `EditorGutter`, matching the cleanup pattern already used in `render()` for unused views.

**Code Sketch:**
```typescript
override dispose(): void {
    super.dispose();

    // Dispose all remaining gutter item views to prevent memory leaks
    for (const [_id, view] of this.views) {
        view.gutterItemView.dispose();
    }
    this.views.clear();

    reset(this._domNode);
}
```

This is a 4-line addition that mirrors the existing cleanup pattern used in the `render()` method for unused views, simply applied to all views on dispose.

## Confidence Level: High

## Reasoning

1. **The retainer chain is clear.** The issue comments explicitly identify `gutterFeature` and a `Map` in `EditorGutter` as the retainer. The `views` map is the only `Map` in `EditorGutter`, and its values hold `gutterItemView` references (which are `DiffToolBar` instances — part of `gutterFeature`).

2. **The cleanup pattern already exists.** The `render()` method already disposes views via `view.gutterItemView.dispose()` when they become unused. The fix simply applies this same pattern to all remaining views when the entire gutter is disposed.

3. **The fix is minimal and surgical.** Only 4 lines added to an existing `dispose()` method, using an established cleanup pattern from the same class. No new abstractions, no new utility functions needed.

4. **Mental trace confirms correctness.** When a diff editor closes → `DiffEditorGutter` disposes → `EditorGutter` disposes → (with fix) all `DiffToolBar` views in the map are disposed → `DiffToolBar`'s registered disposables clean up observable subscriptions, toolbar instances, and DOM references → the diff editor widget graph becomes unreachable → GC collects it. Without the fix, the `DiffToolBar` instances remain alive, holding the entire graph in memory.

5. **PR metadata confirms scope.** The PR touches exactly 1 file, consistent with this being a simple omission in `editorGutter.ts`.
