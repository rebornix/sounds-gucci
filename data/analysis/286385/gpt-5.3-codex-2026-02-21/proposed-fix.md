# Bug Analysis: Issue #286336

## Understanding the Bug

The issue describes a **memory leak related to the diff editor** in VS Code. The symptoms are:

1. When opening two diff editors (side-by-side), then closing all editors, various objects continue to grow in memory
2. Each time the test is repeated (open diff editors, split, close all), the number of `DiffEditorWidget` instances increases
3. Even after closing all editors, there should only be 1 cached editor instance per group, but N instances remain after N repetitions
4. Heap snapshots reveal `gutterFeature` appearing as a retainer for many leaked objects
5. The maintainer's analysis points to `gutterFeature` holding onto the diff editor widget through a "map of views that were never disposed"

**Reproduction steps (from @bpasero's comment):**
- Open a folder with test files (a.txt, b.txt, c.txt, d.txt)
- Right-click `a.txt`: Select for compare
- Right-click `b.txt`: Compare with (diff editor opens)
- Split the diff editor using the split icon
- Close all editors
- Repeat N times
- Heap snapshots show N instances of `DiffEditorWidget` retained by `gutterFeature`

## Git History Analysis

### Time Window Used
- Initial: 24 hours before parent commit (2026-01-06T17:45 to 2026-01-07T17:45)
- Final: 24 hours (no expansion needed)

### Relevant Commits Found

**Commit dc178377f27** (2026-01-07 17:32:34) - "fix: memory leak call stack widget (#286246)"

This commit is highly relevant because:
1. It's a recent memory leak fix that touched similar disposal patterns
2. It was committed just 13 minutes before the parent commit
3. The commit introduced or significantly modified the `EditorGutter` class used by `gutterFeature.ts`

**Key Finding:** The `git blame` output shows that ALL lines in the `EditorGutter.render()` method (lines 103-129) were added by commit dc178377f27, which was fixing another memory leak. This suggests the `EditorGutter` class is relatively new or was recently refactored, and may have introduced a new leak while fixing the old one.

## Root Cause

The memory leak occurs in the `EditorGutter` class in `src/vs/editor/browser/widget/diffEditor/utils/editorGutter.ts`.

**The Problem:**

The `EditorGutter` class maintains a `Map<string, ManagedGutterItemView>` called `views` (line 69). During rendering, this map is populated with view objects. When views are no longer needed, the `render()` method correctly disposes them and removes them from the map (lines 145-149):

```typescript
for (const id of unusedIds) {
    const view = this.views.get(id)!;
    view.gutterItemView.dispose();
    view.domNode.remove();
    this.views.delete(id);
}
```

**However**, when the `EditorGutter` itself is disposed (lines 63-66), the `dispose()` method does NOT:
1. Dispose the views stored in the `this.views` Map
2. Clear the Map itself

```typescript
override dispose(): void {
    super.dispose();
    reset(this._domNode);  // Only clears DOM nodes, doesn't dispose views
}
```

This means when a diff editor is closed, the `EditorGutter` is disposed but all `ManagedGutterItemView` objects in the `views` Map remain in memory. Each `ManagedGutterItemView` holds:
- A reference to `gutterItemView` (an `IGutterItemView` which is `IDisposable`)
- A reference to `item` (an observable)
- A reference to `domNode`

These references prevent the diff editor widgets from being garbage collected, causing the memory leak described in the issue.

## Proposed Fix

### Option A: Targeted Fix (Recommended)

**Affected Files:**
- `src/vs/editor/browser/widget/diffEditor/utils/editorGutter.ts`

**Changes Required:**

Modify the `dispose()` method to properly dispose all views in the `views` Map before calling `reset()` on the DOM node.

**Code Sketch:**

```typescript
override dispose(): void {
    super.dispose();
    
    // Dispose all views in the map
    for (const view of this.views.values()) {
        view.gutterItemView.dispose();
    }
    this.views.clear();
    
    reset(this._domNode);
}
```

**Rationale:**
- This is the minimal fix that addresses the root cause
- Follows the same disposal pattern already used in the `render()` method (lines 145-149)
- Ensures all disposable resources are cleaned up when the gutter is disposed
- Only 4 lines of code added to fix a critical memory leak

### Option B: Comprehensive Fix (Optional)

If we wanted to be more defensive and ensure the `ManagedGutterItemView` class itself handles disposal properly, we could also:

1. Make `ManagedGutterItemView` extend `Disposable`
2. Implement a proper `dispose()` method in `ManagedGutterItemView`
3. Call `dispose()` on each view in `EditorGutter.dispose()`

This would be a more robust solution but requires more changes and may be overkill for this specific bug. The targeted fix in Option A is sufficient and follows the existing code patterns.

## Confidence Level: High

## Reasoning

**Why this fix addresses the root cause:**

1. **Heap snapshot evidence**: The issue explicitly states that `gutterFeature` appears as a retainer in heap snapshots, and the maintainer (@bpasero) confirmed that `gutterFeature` holds onto the diff editor widget "through a map of views that were never disposed"

2. **Code analysis**: The `EditorGutter` class is the only place in the gutter feature that maintains a Map of views. The `views` Map is populated during rendering but never cleaned up during disposal

3. **Validation of the symptom**: 
   - The bug manifests when opening and closing diff editors repeatedly
   - Each cycle should dispose the `DiffEditorGutter`, which internally uses `EditorGutter`
   - Without proper disposal of the `views` Map, each cycle leaks one set of views
   - After N cycles, there are N sets of leaked views, matching the reported symptom

4. **Recent commit context**: The problematic code was introduced/modified by a commit (dc178377f27) that fixed a different memory leak, suggesting disposal patterns were being actively worked on and this was an oversight

5. **Pattern consistency**: The `render()` method already shows the correct disposal pattern (dispose the gutterItemView, then delete from the map). The fix simply applies this same pattern to the `dispose()` method

6. **Minimal surface area**: The fix is surgical (4 lines) and only touches the specific code path that was identified as problematic, reducing the risk of introducing new bugs

The proposed fix directly addresses the memory leak by ensuring that when an `EditorGutter` is disposed (which happens when diff editors are closed), all the views it holds are properly disposed and the Map is cleared, allowing the garbage collector to reclaim the memory.
