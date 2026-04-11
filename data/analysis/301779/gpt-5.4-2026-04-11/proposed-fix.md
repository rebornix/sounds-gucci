# Bug Analysis: Issue #301779

## Understanding the Bug

Dragging a single editor tab in a narrow layout can produce a bad drag preview when the filename is truncated. Instead of only showing the dragged tab, the preview appears to include clipped pixels from the surrounding tab header area, making it look like unrelated parts of the header are moving with the tab.

The issue comments do not add implementation guidance beyond confirming the behavior with a screenshot.

## Git History Analysis

The incremental time-window search around the parent commit did not reveal a likely short-term regression:

- `46c65bcd055` `run oss tool (#304416)`

That suggests this is not obviously tied to a change from the previous 24 hours to 7 days. I then checked the pre-fix history of the relevant tab files for older context:

- `7248ff1cc24` `Fix editor tabs drag and drop (#243543)`
  - This is the most relevant historical change. It introduced the shared `applyDragImage(...)` helper used across workbench drag-and-drop, but `multiEditorTabsControl.ts` still keeps a special-case native drag image for single-tab drags.
- `6d73a37b03b` `Italic text is cut off at the end in tabs and settings (fix #207409) (#242663)`
- `fca79ef32ea` `Display Tab Indexes in VSCode (#209196)`
  - These changes are relevant because `multieditortabscontrol.css` contains several truncation-specific overflow and overlay rules for shrink/fixed tabs, which increase the chance that a native DOM snapshot will include paint outside the intended visual tab bounds.

### Time Window Used

- Initial: 24 hours
- Final: 168 hours (expanded twice, to 3 days and then 7 days)

## Root Cause

`src/vs/workbench/browser/parts/editor/multiEditorTabsControl.ts` uses the live tab DOM node as the drag image for single-tab drags:

```ts
e.dataTransfer.setDragImage(tab, 0, 0);
```

That is fragile for truncated tabs because the tab rendering in shrink/fixed layouts depends on overflow-sensitive styling and visual overlays from `src/vs/workbench/browser/parts/editor/media/multieditortabscontrol.css` such as:

- the truncation fade overlay on `.monaco-icon-label-container::after`
- overflow changes on `.tab-actions` for hover/focus/dirty states
- clipping-related label tweaks for narrow tabs

When the browser snapshots the real tab element for the drag image, those paint effects can leak into the captured image, so the drag preview visually contains extra header UI instead of only the dragged tab.

## Proposed Fix

### Option A: Targeted Fix (Recommended)

**Affected Files:**

- `src/vs/workbench/browser/parts/editor/multiEditorTabsControl.ts`

**Changes Required:**

Stop using `dataTransfer.setDragImage(tab, 0, 0)` for the single-tab case. Use the existing shared `applyDragImage(...)` helper for both single-tab and multi-tab drags, with the single-tab label set to `editor.getName()`.

This keeps the drag preview detached from the live tab DOM and avoids capturing truncation-specific overflow or header paint artifacts.

**Code Sketch:**

```ts
if (e.dataTransfer) {
	e.dataTransfer.effectAllowed = 'copyMove';
	if (selectedEditors.length > 1) {
		const label = `${editor.getName()} + ${selectedEditors.length - 1}`;
		applyDragImage(e, tab, label);
	} else {
		applyDragImage(e, tab, editor.getName());
	}
}
```

### Option B: Comprehensive Fix (Optional)

If preserving a tab-shaped drag preview is important, a broader alternative would be to adjust the tab CSS in `src/vs/workbench/browser/parts/editor/media/multieditortabscontrol.css` so the dragged tab paints strictly within its own box during snapshotting.

I do not recommend leading with that approach because it is riskier: the same stylesheet intentionally uses overflow and overlay behavior to keep narrow tabs usable, and changing that could regress hover actions, sticky tabs, or truncation visuals.

## Confidence Level: Medium

## Reasoning

The symptom is purely visual and happens during drag preview creation, not after drop, which points directly at drag-image generation rather than tab reordering logic.

The implementation is asymmetric today:

- multi-selection already uses `applyDragImage(...)`
- editor-group drags already use `applyDragImage(...)`
- single-tab drags alone still use the live DOM snapshot

That single special-case lines up with the reported behavior. It also explains why the issue becomes noticeable specifically when filenames are truncated: that is when the tab DOM relies on clipping and overlay rules that are most likely to confuse native drag-image capture.

Mentally tracing the fix is straightforward: if the preview comes from a synthetic drag image instead of the real tab DOM, the browser no longer has a chance to include neighboring header pixels in the dragged image, so the visual artifact should disappear without changing tab ordering or drop-target logic.