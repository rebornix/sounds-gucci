# Bug Analysis: Issue #286336

## Understanding the Bug

- **Expected:** After closing all diff editors (including after splitting), only the normal single cached editor-group behavior should remain; `DiffEditorWidget` instances should not accumulate.
- **Actual:** Repeating open → split diff → close all leaves **N** retained `DiffEditorWidget` instances (heap comparison between snapshots). Maintainer investigation points to **`gutterFeature` / `EditorGutter`**: a **Map of gutter views that are never disposed**, so it retains the diff editor widget graph.

Repro (from issue comments): compare two files, split the diff editor, “Close All Editors”, repeat; compare heap snapshots and search for `DiffEditorWidget`.

## Git History Analysis

- Searched `git log` for `src/vs/editor/browser/widget/diffEditor/utils/editorGutter.ts` at `parentCommit`; no commits in the 7-day window before parent touching this path (file is relatively new in history).
- Code inspection at parent: `DiffEditorGutter` in `gutterFeature.ts` registers an `EditorGutter` on the modified editor; gutter item views are `DiffToolBar` instances created via `createView`.

### Time Window Used

- Initial: 24 hours before parent — no relevant commits for `editorGutter.ts`
- Final: 7 days — still no file-specific history; root cause inferred from code + issue comments

## Root Cause

`EditorGutter` (`diffEditor/utils/editorGutter.ts`) stores live gutter UI in `this.views: Map<string, ManagedGutterItemView>`. Each entry wraps an `IGutterItemView` (e.g. `DiffToolBar`) that must be `dispose()`d.

1. **`dispose()` omits map cleanup:** `EditorGutter.dispose()` calls `super.dispose()` (tears down autoruns) and `reset(this._domNode)` but **never** disposes entries in `this.views` or clears the map. Those disposables keep references to diff-editor–related state, matching the retainer chain described in the issue (`gutterFeature` → Map → widgets).

2. **Early exit when no model (secondary leak path):** `render()` returns immediately when `!this.modelAttached.read(reader)` without removing existing map entries, so views can outlive model detachment until the next full render path runs—if ever.

## Proposed Fix

### Option A: Targeted Fix (Recommended)

**Affected Files:**

- `src/vs/editor/browser/widget/diffEditor/utils/editorGutter.ts`

**Changes Required:**

1. In `EditorGutter.dispose()`, **before** `super.dispose()`, iterate `this.views`: call `view.gutterItemView.dispose()`, remove the view DOM node if still attached, then `this.views.clear()`. Keep `reset(this._domNode)` after `super.dispose()` (or after clearing children explicitly—either is fine once disposables are released).

2. (Recommended hardening) When `render()` sees `!modelAttached`, run the same cleanup as for “unused” ids (dispose all mapped views and clear the map) so model switches do not leave stale gutter toolbars.

**Code Sketch:**

```typescript
// EditorGutter.dispose()
override dispose(): void {
	for (const view of this.views.values()) {
		view.gutterItemView.dispose();
		view.domNode.remove();
	}
	this.views.clear();
	super.dispose();
	reset(this._domNode);
}

// EditorGutter.render() — start of method
private render(reader: IReader): void {
	if (!this.modelAttached.read(reader)) {
		for (const id of [...this.views.keys()]) {
			const view = this.views.get(id)!;
			view.gutterItemView.dispose();
			view.domNode.remove();
			this.views.delete(id);
		}
		return;
	}
	// ... existing logic
}
```

### Option B: Comprehensive Fix (Optional)

Audit other `EditorGutter` implementations (e.g. merge editor duplicate under `workbench/.../view/editorGutter.ts`) for the same `dispose()` / `modelAttached` pattern and align behavior so all gutters dispose item views consistently.

## Confidence Level: High

## Reasoning

- The issue explicitly identifies **gutter retainers** and a **Map of views not disposed**; the only `Map` in this stack for diff gutter rendering is `EditorGutter.views`.
- `ManagedGutterItemView` holds `IGutterItemView` instances that register disposables (`DiffToolBar` uses `autorun`, `MenuWorkbenchToolBar`, etc.); without `dispose()` on widget teardown, those graphs stay alive and keep parent editors reachable.
- Disposing map entries on `EditorGutter.dispose()` directly addresses “close all editors” / repeated open-close cycles where the gutter disposable runs but child views did not.
