# Bug Analysis: Issue #291089

## Understanding the Bug

In the agent session window (which uses the `workbench.secondarySideBar.forceMaximized` setting), the secondary sidebar (auxiliary bar) is maximized on startup, hiding the editor, panel, and sidebar parts. When the user opens an editor (e.g., via "Help: Welcome" or "Show Settings Editor"), the layout "falls over":

1. The terminal panel unexpectedly pops up (with "justify" alignment filling the area)
2. The actual editor may be visually obscured by or competing with the panel
3. The panel cannot be closed via the X button afterward

The issue reporter (@sbatten) notes this happens when testing the agent session window feature and is distinct from other issues marked as duplicates.

## Git History Analysis

### Time Window Used
- Initial: 24 hours
- Final: ~7 days (expanded to find the feature introduction and related fixes)

### Key Commits Found

1. **`c721687d369`** — "layout - reduce scope of `workbench.secondarySideBar.forceMaximized` to only apply when editors are closed (#291293)"
   - Already in our parent commit
   - Simplified `maybeMaximizeAuxiliaryBar()` by removing sidebar/panel visibility checks
   - Removed `onDidChangePartVisibility` listener that re-maximized on sidebar/panel hide
   - Commit message: "We later need to revisit how a better layout would be for focus on sessions, but the current implementation has too many bugs."

2. **`b3e1fad0633`** — "agent sessions - fix endless loop with maximising 2nd sidebar (#290286)"
   - Added typed `IPartVisibilityChangeEvent` to `onDidChangePartVisibility`
   - Added `onDidChangePartVisibility` listener to re-maximize aux bar when sidebar/panel hides
   - **This listener was REMOVED by `c721687d369`** because it caused issues

3. **`e7c53a91c7a`** — "introduce workbench mode for agent sessions window (#290500)"
   - Introduced the agent sessions workbench mode with `forceMaximized: true`
   - The mode config includes settings like `startupEditor: none`, `restoreEditors: false`

4. **`e2262a93104`** — "fix layout when secondary bar force maximized setting changes (#290612)"
   - An earlier fix for layout issues with the force maximized setting

## Root Cause

The bug is in the `showEditorIfHidden()` function in `src/vs/workbench/browser/layout.ts`.

When `forceMaximized` is active and all editors are closed, the auxiliary bar is maximized. To maximize, `setAuxiliaryBarMaximized(true)` saves the current visibility state of all parts in `AUXILIARYBAR_LAST_NON_MAXIMIZED_VISIBILITY`:

```typescript
const state = {
    sideBarVisible: this.isVisible(Parts.SIDEBAR_PART),
    editorVisible: this.isVisible(Parts.EDITOR_PART),
    panelVisible: this.isVisible(Parts.PANEL_PART),  // <-- potentially TRUE
    auxiliaryBarVisible: this.isVisible(Parts.AUXILIARYBAR_PART)
};
```

When a user opens an editor (e.g., Welcome), `onDidVisibleEditorsChange` fires → `showEditorIfHidden()` calls `toggleMaximizedAuxiliaryBar()` → `setAuxiliaryBarMaximized(false)` which **restores the full saved state**, including `panelVisible`:

```typescript
this.setEditorHidden(!state?.editorVisible);   // shows editor ✓
this.setPanelHidden(!state?.panelVisible);      // SHOWS PANEL if it was saved as visible ✗
this.setSideBarHidden(!state?.sideBarVisible);  // shows sidebar if it was saved as visible ✗
```

The saved `panelVisible` can be `true` in two scenarios:
1. **At startup** (`applyAuxiliaryBarMaximizedOverride`): captures `panelVisible: !PANEL_HIDDEN` from stored workspace state. If the panel was visible in a previous session, `panelVisible` is saved as `true`.
2. **After re-maximization**: When the user closes all editors, `maybeMaximizeAuxiliaryBar()` re-maximizes and saves the current state, which may include a visible panel if the user opened it.

The result: opening an editor causes the terminal panel to appear (with potentially problematic alignment like "justify"), creating a broken layout where the editor is obscured and the panel can't be closed properly.

## Proposed Fix

### Option A: Targeted Fix (Recommended)

**Affected Files:**
- `src/vs/workbench/browser/layout.ts`

**Changes Required:**
1. In `showEditorIfHidden()`: Before calling `toggleMaximizedAuxiliaryBar()`, update the saved `AUXILIARYBAR_LAST_NON_MAXIMIZED_VISIBILITY` state to ensure only the editor is shown, preventing panel/sidebar from being restored.

2. In `applyAuxiliaryBarMaximizedOverride()`: Hardcode `panelVisible: false` and `sideBarVisible: false` instead of reading from the stored workspace state. When force-maximized, the pre-maximization state should always be a clean "editor only" layout, regardless of what the previous session had.

**Code Sketch:**

Change 1 — `showEditorIfHidden` (around line 342):
```typescript
const showEditorIfHidden = () => {
    if (
        this.isVisible(Parts.EDITOR_PART, mainWindow) ||
        this.mainPartEditorService.visibleEditors.length === 0
    ) {
        return;
    }

    if (this.isAuxiliaryBarMaximized()) {
        // When un-maximizing to show editors, only restore the editor
        // part. Do not restore panel/sidebar to prevent unexpected
        // layout changes (e.g., terminal popping up in agent sessions)
        this.stateModel.setRuntimeValue(
            LayoutStateKeys.AUXILIARYBAR_LAST_NON_MAXIMIZED_VISIBILITY, {
                sideBarVisible: false,
                editorVisible: true,
                panelVisible: false,
                auxiliaryBarVisible: true
            }
        );
        this.toggleMaximizedAuxiliaryBar();
    } else {
        this.toggleMaximizedPanel();
    }
};
```

Change 2 — `applyAuxiliaryBarMaximizedOverride` (around line 3012):
```typescript
private applyAuxiliaryBarMaximizedOverride(): void {
    this.setRuntimeValue(LayoutStateKeys.AUXILIARYBAR_LAST_NON_MAXIMIZED_VISIBILITY, {
        sideBarVisible: false,  // Don't restore sidebar from previous session
        panelVisible: false,    // Don't restore panel from previous session
        editorVisible: !this.getRuntimeValue(LayoutStateKeys.EDITOR_HIDDEN),
        auxiliaryBarVisible: !this.getRuntimeValue(LayoutStateKeys.AUXILIARYBAR_HIDDEN)
    });

    this.setRuntimeValue(LayoutStateKeys.SIDEBAR_HIDDEN, true);
    this.setRuntimeValue(LayoutStateKeys.PANEL_HIDDEN, true);
    this.setRuntimeValue(LayoutStateKeys.EDITOR_HIDDEN, true);
    this.setRuntimeValue(LayoutStateKeys.AUXILIARYBAR_HIDDEN, false);

    this.setRuntimeValue(LayoutStateKeys.AUXILIARYBAR_LAST_NON_MAXIMIZED_SIZE,
        this.getInitializationValue(LayoutStateKeys.AUXILIARYBAR_SIZE));
    this.setRuntimeValue(LayoutStateKeys.AUXILIARYBAR_WAS_LAST_MAXIMIZED, true);
}
```

### Option B: Workbench Mode Configuration

If the approach is to add panel-hidden-related settings, the agent sessions workbench mode config (`resources/workbenchModes/agent-sessions.code-workbench-mode`) could be updated with panel-related settings. However, there's no direct "panel hidden" setting available — `PANEL_HIDDEN` is a workspace state, not a user setting. So this approach alone wouldn't fully resolve the issue.

## Confidence Level: Medium-High

## Reasoning

1. **The code path is clear**: `showEditorIfHidden` → `toggleMaximizedAuxiliaryBar()` → `setAuxiliaryBarMaximized(false)` → restores full state including panel visibility.

2. **The saved state is the problem**: `AUXILIARYBAR_LAST_NON_MAXIMIZED_VISIBILITY` captures the panel state from startup (or previous re-maximization), which may include `panelVisible: true` from the workspace's previous session.

3. **The fix is targeted**: Updating the saved state before un-maximizing ensures only the editor part is restored, preventing the panel from appearing unexpectedly. The `applyAuxiliaryBarMaximizedOverride` change ensures the initial saved state is always clean.

4. **The fix preserves user intent**: If the user explicitly opens the panel while an editor is visible, then closes the editor (triggering re-maximization), the current panel state IS saved. However, when the next editor opens, `showEditorIfHidden` will again override the saved state to show only the editor. This is correct behavior — the panel should not persist across maximize/un-maximize transitions triggered by forceMaximized.

5. **Confidence is medium-high** because: the core analysis of the layout interaction is solid, but the exact second file in the 2-file change is uncertain. The fix may involve changes to `layoutService.ts` (interface) or `workbench.contribution.ts` (settings) that I haven't fully identified. The `showEditorIfHidden` fix addresses the core symptom described in the issue.
