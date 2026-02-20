# Bug Analysis: Issue #286336 - Memory leak related to diff editor

## Understanding the Bug

The bug is a memory leak occurring in the diff editor component. When opening two diff editors and then closing all editors, various functions and objects continue to grow in memory with each iteration. The expected behavior is that after closing all editors, only 1 instance should remain (cached for speedy reopening), but instead N instances accumulate where N is the number of times the diff editor was opened.

### Key Symptoms:
- Heap snapshots show multiple `DiffEditorWidget` instances remaining in memory after editors are closed
- The retainer path analysis points to `gutterFeature` holding references to disposed diff editor widgets
- Objects are retained through a `Map` of views in `EditorGutter` that are never disposed
- Each open/close cycle adds more leaked instances

### Reproduction Steps:
1. Open two diff editors (e.g., "Select for compare" and "Compare with" in explorer)
2. Split the diff editor using the split icon
3. Close all editors
4. Repeat N times
5. Take heap snapshots and compare - `DiffEditorWidget` instances exist N times instead of 1

## Git History Analysis

### Time Window Used
- Initial: 24 hours
- Final: 7 days (expanded to find recent memory leak fixes)

### Relevant Context
Searching the git history around the parent commit (2026-01-07), I found several memory leak fixes in the codebase during this period:
- Terminal process manager memory leaks
- Call stack widget memory leak
- Terminal WebGL memory leak
- Various disposable leaks

This indicates the team was actively hunting memory leaks, and the diff editor gutter was likely identified through heap snapshot analysis as mentioned in the issue comments.

## Root Cause

The memory leak is in the `EditorGutter` class located at:
**`src/vs/editor/browser/widget/diffEditor/utils/editorGutter.ts`**

### The Problem:

1. **Line 40**: The class maintains a `Map` of views:
   ```typescript
   this.views = new Map<string, ManagedGutterItemView>();
   ```

2. **Lines 145-150**: During rendering, unused views are properly cleaned up:
   ```typescript
   for (const id of unusedIds) {
       const view = this.views.get(id)!;
       view.gutterItemView.dispose();  // ✓ Disposed
       view.domNode.remove();           // ✓ Removed from DOM
       this.views.delete(id);           // ✓ Removed from Map
   }
   ```

3. **Lines 64-68**: When the `EditorGutter` itself is disposed, the cleanup is incomplete:
   ```typescript
   override dispose(): void {
       super.dispose();
       reset(this._domNode);  // Only resets DOM
       // ❌ PROBLEM: this.views Map is never cleaned up!
   }
   ```

### Why This Causes a Leak:

When a diff editor is closed:
- The `EditorGutter` instance's `dispose()` method is called
- The DOM node is reset, but **all views in the `this.views` Map are still alive**
- These views contain references to:
  - `IGutterItemView` instances (like `DiffToolBar`)
  - Observable values
  - DOM elements
  - The diff editor widget itself through closures
- The entire object graph remains in memory because the views are not disposed
- Each time you open/close a diff editor, another set of undisposed views accumulates

## Proposed Fix

### Affected Files
- `src/vs/editor/browser/widget/diffEditor/utils/editorGutter.ts`

### Changes Required

The `dispose()` method must iterate through all remaining views in the Map and properly dispose them before calling `super.dispose()`.

### Code Changes

In `src/vs/editor/browser/widget/diffEditor/utils/editorGutter.ts`, modify the `dispose()` method (lines 64-68):

**Current Code:**
```typescript
override dispose(): void {
    super.dispose();

    reset(this._domNode);
}
```

**Fixed Code:**
```typescript
override dispose(): void {
    super.dispose();

    // Dispose all remaining views to prevent memory leak
    for (const [_id, view] of this.views) {
        view.gutterItemView.dispose();
        view.domNode.remove();
    }
    this.views.clear();

    reset(this._domNode);
}
```

### Explanation of Fix:

1. **Iterate through all views**: Use `for (const [_id, view] of this.views)` to access each view in the Map
2. **Dispose the view**: Call `view.gutterItemView.dispose()` to properly clean up the view and its resources
3. **Remove DOM node**: Call `view.domNode.remove()` to remove the DOM element (though `reset(this._domNode)` will also clear children, being explicit prevents edge cases)
4. **Clear the Map**: Call `this.views.clear()` to remove all entries from the Map
5. **Then proceed with normal cleanup**: Reset the DOM node as before

This mirrors the cleanup pattern already used in the `render()` method (lines 145-150) for removing unused views, ensuring consistent disposal behavior.

## Confidence Level: High

## Reasoning

1. **Issue description matches the fix**: The issue explicitly mentions `gutterFeature` and a `Map` holding views that were never disposed
2. **Heap snapshot evidence**: The retainer path shown in the issue points directly to `gutterFeature` → `EditorGutter` → views Map
3. **Code analysis confirms**: The `dispose()` method clearly lacks cleanup for the `views` Map
4. **Consistent pattern**: The fix follows the same disposal pattern already used in the `render()` method for cleaning up unused views
5. **Similar fixes in codebase**: The git history shows multiple similar dispose-related memory leak fixes around the same time period
6. **Comments confirm**: The issue comment from @bpasero states: "we found it to hold onto the diff editor widget through a map of views that were never disposed"

This is a textbook disposable leak where resources are properly managed during normal operation (render cycle) but not properly cleaned up during final disposal of the parent object.
