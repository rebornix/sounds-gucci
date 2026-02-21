# Bug Analysis: Issue #291089

## Understanding the Bug

**Issue**: In the agent session window, opening editors (e.g., "Help: Welcome" or "Show Settings Editor") causes the layout to break — the terminal/panel pops up instead of showing the editor, and the panel cannot be closed afterward ("X does nothing").

**Context**: The agent session mode sets `workbench.secondarySideBar.forceMaximized: true`, which maximizes the auxiliary bar on startup, hiding the editor part, sidebar, and panel. When the user opens an editor, the auxiliary bar should un-maximize to show the editor. Instead, the layout "falls over."

## Git History Analysis

### Time Window Used
- Initial: 24 hours
- Final: 72 hours (expanded once to capture the referenced layout commits)

### Relevant Commits

1. **`c721687d369`** (2026-01-28): "layout - reduce scope of `workbench.secondarySideBar.forceMaximized` to only apply when editors are closed" — Removed the listener that re-maximized the auxiliary bar when the sidebar or panel hid. Simplified the `maybeMaximizeAuxiliaryBar` condition to only check for empty visible editors (no longer checking sidebar/panel visibility).

2. **`cbf05da8123`** (NOT merged into parent commit): "Fix justified panel alignment when exiting maximized secondary sidebar" — PR #290241, which the issue reporter was testing. This adds `adjustPartPositions()` to `setAuxiliaryBarMaximized(false)` but is NOT the fix for #291089.

3. **`9fffd2bd580`** (2026-01-27): "add actions to switch workbench mode" — Added actions for switching between agent session and normal modes.

## Root Cause

The bug has **two interacting root causes**:

### Root Cause 1: Stale pre-maximized state in `applyAuxiliaryBarMaximizedOverride()`

When the agent session window starts, `applyAuxiliaryBarMaximizedOverride()` saves the "pre-maximized" visibility state from storage to `AUXILIARYBAR_LAST_NON_MAXIMIZED_VISIBILITY`. This state is restored when un-maximizing the auxiliary bar.

The problem: values loaded from workspace storage from a **previous session** can be stale:
- `EDITOR_HIDDEN` may be `true` (saved when the aux bar was maximized last session), leading to `editorVisible: false`
- `PANEL_HIDDEN` may be `false` (terminal was visible last session), leading to `panelVisible: true`

When un-maximizing:
- `setEditorHidden(!false) = setEditorHidden(true)` → editor stays hidden!
- `setPanelHidden(!true) = setPanelHidden(false)` → panel/terminal pops up!

Even worse, `setEditorHidden(true)` triggers a constraint: *"The editor and panel cannot be hidden at the same time unless we have a maximized auxiliary bar."* Since `isAuxiliaryBarMaximized()` is already set to `false` before the transition, this constraint fires `setPanelHidden(false, true)`, forcing the panel visible.

**Code reference** (`layout.ts:3012-3030`):
```typescript
private applyAuxiliaryBarMaximizedOverride(): void {
    this.setRuntimeValue(LayoutStateKeys.AUXILIARYBAR_LAST_NON_MAXIMIZED_VISIBILITY, {
        sideBarVisible: !this.getRuntimeValue(LayoutStateKeys.SIDEBAR_HIDDEN),
        panelVisible: !this.getRuntimeValue(LayoutStateKeys.PANEL_HIDDEN),        // ← stale from storage
        editorVisible: !this.getRuntimeValue(LayoutStateKeys.EDITOR_HIDDEN),      // ← stale from storage
        auxiliaryBarVisible: !this.getRuntimeValue(LayoutStateKeys.AUXILIARYBAR_HIDDEN)
    });
    // ...
}
```

### Root Cause 2: `showEditorIfHidden()` uses `toggleMaximizedPanel()` as a fallback, which breaks with non-center panel alignment

After un-maximizing the auxiliary bar, if the editor is still hidden (because of root cause 1), the `showEditorIfHidden` function falls through to the `else` branch:

```typescript
if (this.isAuxiliaryBarMaximized()) {
    this.toggleMaximizedAuxiliaryBar();
} else {
    this.toggleMaximizedPanel();  // ← Called when aux bar is no longer maximized
}
```

`toggleMaximizedPanel()` calls `isPanelMaximized()`, which returns `false` for 'justify' alignment:
```typescript
isPanelMaximized(): boolean {
    return (
        this.getPanelAlignment() === 'center' || // 'justify' ≠ 'center' → false
        !isHorizontal(this.getPanelPosition())    // bottom is horizontal → false
    ) && ...;
}
```

Since `isPanelMaximized()` returns `false`, `toggleMaximizedPanel()` tries to **maximize** (not un-maximize) the panel, which calls `setEditorHidden(true)` — the exact opposite of what we want! This hides the editor and triggers the constraint to force-show the panel.

**This creates a cycle**: Panel shows → user clicks X → `setPanelHidden(true)` → `focusEditor()` → `onDidActivateGroup` → `showEditorIfHidden()` → editor still hidden, aux bar not maximized → `toggleMaximizedPanel()` → tries to maximize → `setEditorHidden(true)` → constraint forces panel visible again.

This is why **"X does nothing"** — the panel keeps being re-shown by the cycle.

## Proposed Fix

### Option A: Targeted Fix (Recommended)

**Affected Files:**
- `src/vs/workbench/browser/layout.ts`

**Changes Required:**

**Change 1**: Fix `showEditorIfHidden()` to not rely on `toggleMaximizedPanel()` as a fallback. Instead, after un-maximizing the auxiliary bar, directly ensure the editor is visible.

**Change 2**: Fix `applyAuxiliaryBarMaximizedOverride()` to use clean defaults for the pre-maximized state instead of stale storage values.

**Code Sketch:**

```typescript
// Change 1: Fix showEditorIfHidden (lines 342-355)
const showEditorIfHidden = () => {
    if (
        this.isVisible(Parts.EDITOR_PART, mainWindow) ||       // already visible
        this.mainPartEditorService.visibleEditors.length === 0  // no editor to show
    ) {
        return;
    }

    if (this.isAuxiliaryBarMaximized()) {
        this.setAuxiliaryBarMaximized(false);
    }

    // After un-maximizing (or if aux bar wasn't maximized),
    // ensure the editor part is visible since we have editors to show
    if (!this.isVisible(Parts.EDITOR_PART, mainWindow)) {
        this.setEditorHidden(false);
    }
};
```

```typescript
// Change 2: Fix applyAuxiliaryBarMaximizedOverride (lines 3012-3030)
private applyAuxiliaryBarMaximizedOverride(): void {
    this.setRuntimeValue(LayoutStateKeys.AUXILIARYBAR_LAST_NON_MAXIMIZED_VISIBILITY, {
        sideBarVisible: !this.getRuntimeValue(LayoutStateKeys.SIDEBAR_HIDDEN),
        panelVisible: false,  // Don't restore panel from stale storage state
        editorVisible: true,  // Always show editor when un-maximizing from force-maximized
        auxiliaryBarVisible: !this.getRuntimeValue(LayoutStateKeys.AUXILIARYBAR_HIDDEN)
    });

    this.setRuntimeValue(LayoutStateKeys.SIDEBAR_HIDDEN, true);
    this.setRuntimeValue(LayoutStateKeys.PANEL_HIDDEN, true);
    this.setRuntimeValue(LayoutStateKeys.EDITOR_HIDDEN, true);
    this.setRuntimeValue(LayoutStateKeys.AUXILIARYBAR_HIDDEN, false);

    this.setRuntimeValue(LayoutStateKeys.AUXILIARYBAR_LAST_NON_MAXIMIZED_SIZE, this.getInitializationValue(LayoutStateKeys.AUXILIARYBAR_SIZE));
    this.setRuntimeValue(LayoutStateKeys.AUXILIARYBAR_WAS_LAST_MAXIMIZED, true);
}
```

**Why this works:**

- **Change 1** breaks the cycle: instead of calling `toggleMaximizedPanel()` (which misbehaves with non-center panel alignment), it directly calls `setEditorHidden(false)`. This has no side effects on the panel and simply shows the editor. It also handles the case where un-maximizing the aux bar didn't show the editor (because of stale state).

- **Change 2** prevents the stale state problem at the source: when the auxiliary bar is force-maximized at startup, the "pre-maximized" state always has `editorVisible: true` (so un-maximizing always shows the editor) and `panelVisible: false` (so the terminal doesn't pop up). During normal operation (non-startup maximize/un-maximize), the actual current state is still saved correctly by `setAuxiliaryBarMaximized(true)`.

### Option B: Minimal Fix (Change 1 Only)

If only Change 1 is applied:
- The cycle is broken (panel X button works)
- The editor always becomes visible after un-maximizing
- **But**: the panel may still pop up during un-maximize if `panelVisible: true` was saved from storage. The user would see both editor and panel. This is a cosmetic issue (not "layout falling over"), and the user can close the panel normally.

## Confidence Level: High

## Reasoning

1. **Root cause 1 is confirmed** by tracing the code path: `applyAuxiliaryBarMaximizedOverride()` reads `EDITOR_HIDDEN` and `PANEL_HIDDEN` from storage, which can have stale values from a previous session where the aux bar was maximized (editor hidden) or the terminal was open (panel visible).

2. **Root cause 2 is confirmed** by tracing `isPanelMaximized()`: with 'justify' alignment, it always returns `false`, making `toggleMaximizedPanel()` call `setEditorHidden(true)` instead of `setEditorHidden(false)`. This creates the cycle that prevents closing the panel.

3. **The "X does nothing" symptom** is explained by the cycle: `setPanelHidden(true)` → `focusEditor` → `onDidActivateGroup` → `showEditorIfHidden` → `toggleMaximizedPanel()` → `setEditorHidden(true)` → constraint forces panel visible again.

4. **Mental trace of the fix**: With both changes applied, opening an editor in the agent session window:
   - `showEditorIfHidden()` calls `setAuxiliaryBarMaximized(false)`
   - Un-maximize restores `editorVisible: true, panelVisible: false` (from change 2)
   - `setEditorHidden(false)` → editor shows, no constraint triggered
   - `setPanelHidden(true)` → panel stays hidden
   - After un-maximize, editor IS visible → `showEditorIfHidden` skips the follow-up
   - ✅ Editor visible, panel hidden, layout intact
