# Bug Analysis: Issue #291089

## Understanding the Bug

The issue occurs in the agent session window mode where:
- The auxiliary bar is force maximized by default (`workbench.secondarySideBar.forceMaximized: true`)
- When the user runs "Help: Welcome" or "Show settings editor" commands to open an editor
- The terminal panel unexpectedly pops up with incorrect alignment
- The panel cannot be closed (X button does nothing)

The bug was reported as occurring even when testing PR #290241, which added a call to `adjustPartPositions()` to fix panel alignment issues when exiting maximized auxiliary bar state.

## Git History Analysis

### Time Window Used
- Initial: 24 hours before parent commit
- Final: 24 hours (no expansion needed)

### Relevant Commits Found

1. **e7c53a91c7a** (Jan 26, 2026) - "introduce workbench mode for agent sessions window"
   - Introduced the agent sessions workbench mode with `forceMaximized: true` setting
   - Created the framework for auto-maximizing the auxiliary bar when no editors are visible

2. **cbf05da8123** (Jan 28, 2026) - "Fix justified panel alignment when exiting maximized secondary sidebar" (PR #290241)
   - Added `adjustPartPositions()` call after restoring visibility state in `setAuxiliaryBarMaximized(false)`
   - This is the PR the user was testing when they found the current bug

## Root Cause

The bug is a **race condition during auxiliary bar un-maximize transition**. Here's the detailed flow:

### Scenario in Agent Session Mode:

1. **Initial State**: Auxiliary bar is maximized, editor is hidden, panel is hidden
   - `AUXILIARYBAR_WAS_LAST_MAXIMIZED` = `true`
   - Saved visibility state has `editorVisible: false`

2. **User Opens Editor**: This triggers `showEditorIfHidden()` → `toggleMaximizedAuxiliaryBar()` → `setAuxiliaryBarMaximized(false)`

3. **Inside `setAuxiliaryBarMaximized(false)` (line 2123-2141)**:
   - Line 2125: Sets `AUXILIARYBAR_WAS_LAST_MAXIMIZED = false` **BEFORE** restoring visibility
   - Line 2127: Sets `inMaximizedAuxiliaryBarTransition = true`
   - Line 2129: Calls `setEditorHidden(!state?.editorVisible)`
     - Since `state.editorVisible` is `false`, this calls `setEditorHidden(true)`

4. **Inside `setEditorHidden(true)` (line 1825-1847)**:
   - Line 1844: Checks if editor is being hidden AND panel is not visible AND auxiliary bar is not maximized:
     ```typescript
     if (hidden && !this.isVisible(Parts.PANEL_PART) && !this.isAuxiliaryBarMaximized()) {
         this.setPanelHidden(false, true);  // Auto-show panel!
     }
     ```
   - **BUG**: `isAuxiliaryBarMaximized()` returns `false` (already changed at line 2125)
   - Even though we're in the middle of the un-maximize transition (`inMaximizedAuxiliaryBarTransition = true`)
   - The check passes and the panel is incorrectly shown!

5. **Result**: Panel pops up unexpectedly, and without `adjustPartPositions()` being called yet (happens later), the layout is broken

### Why the Check Exists

The logic at line 1844-1846 exists to enforce the rule: **"The editor and panel cannot be hidden at the same time unless we have a maximized auxiliary bar"**. However, it doesn't account for the transition period when we're un-maximizing the auxiliary bar but haven't finished restoring all visibility states yet.

## Proposed Fix

### Affected Files
- `src/vs/workbench/browser/layout.ts`

### Changes Required

**Fix the race condition** by checking the transition state in addition to the maximized state. Modify the condition at line 1844 to also check `inMaximizedAuxiliaryBarTransition`:

```typescript
// Before (line 1844-1846):
if (hidden && !this.isVisible(Parts.PANEL_PART) && !this.isAuxiliaryBarMaximized()) {
    this.setPanelHidden(false, true);
}

// After:
if (hidden && !this.isVisible(Parts.PANEL_PART) && !this.isAuxiliaryBarMaximized() && !this.inMaximizedAuxiliaryBarTransition) {
    this.setPanelHidden(false, true);
}
```

### Why This Fixes the Issue

1. **Prevents premature panel showing**: During the un-maximize transition, even though `isAuxiliaryBarMaximized()` returns `false`, the `inMaximizedAuxiliaryBarTransition` flag prevents the auto-show logic from triggering

2. **Maintains the invariant correctly**: After the transition completes (when `inMaximizedAuxiliaryBarTransition` is set back to `false`), the normal rules apply:
   - If editor and panel are both hidden, and auxiliary bar is not maximized, panel will be shown
   - During transition, we trust the saved visibility state restoration logic

3. **Works with PR #290241**: The existing `adjustPartPositions()` call added by PR #290241 will still ensure proper alignment, but now the panel won't be incorrectly shown in the first place

### Why the Panel Can't Be Closed

The second symptom ("cannot close the panel") likely occurs because:
1. The panel was shown via the auto-show logic during transition
2. But the layout state is inconsistent because the transition hadn't completed
3. The close action might be checking `isAuxiliaryBarMaximized()` or other state that's in flux
4. By preventing the premature panel show, this symptom should also be resolved

## Confidence Level: **High**

## Reasoning

1. **Clear causation**: The timing of when `AUXILIARYBAR_WAS_LAST_MAXIMIZED` is set to `false` (before visibility restoration) directly causes the bug
2. **Matches symptoms**: Explains both why the panel appears and why it appears during editor opening in agent session mode
3. **Minimal change**: Adds one condition check to an existing guard clause
4. **Consistent pattern**: Other parts of the code already use `inMaximizedAuxiliaryBarTransition` for re-entrance prevention (line 2085)
5. **Testing context**: The issue was found while testing PR #290241, which addresses a related but different problem (alignment). This is an independent bug in the visibility restoration logic.
