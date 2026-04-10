# Bug Analysis: Issue #291089

## Understanding the Bug

In the **Agent Sessions** window (dedicated agent-sessions workspace / mode with `workbench.secondarySideBar.forceMaximized: true` and a chat-centric layout), running commands that open normal workbench editors—**Help: Welcome** or **Show Settings Editor**—breaks the layout:

- The **terminal** appears (panel) instead of a stable editor area, matching a **Justify** panel alignment setup described in the issue.
- After that, the user **cannot close the panel** (the close affordance does nothing)—consistent with the workbench being stuck in an inconsistent visibility/maximized state between editor, panel, and auxiliary (chat) areas.

Expected: editors open in the main editor area without stealing focus into a broken panel layout; panel chrome should remain functional.

## Git History Analysis

At `parentCommit` `cceba815b0d6a91d0665261e101a12bed91cb037`, a 7-day window before the parent timestamp only surfaces the parent itself; there is no denser nearby history to cite as a regression pointer. Investigation therefore relies on code paths tied to **secondary side bar force-maximized** defaults in `resources/workbenchModes/agent-sessions.code-workbench-mode` and workbench layout handling.

### Time Window Used

- Initial: 24 hours  
- Final: 7 days (no additional relevant commits in range)

## Root Cause

Workbench layout registers `mainPartEditorService.onDidVisibleEditorsChange` and, when `maybeMaximizeAuxiliaryBar()` does not handle the event, runs `showEditorIfHidden()` (`src/vs/workbench/browser/layout.ts`).

`showEditorIfHidden` is meant to **restore** the main editor part when it is hidden but an editor has opened. If the **auxiliary bar is maximized** (chat sessions UI), it correctly calls `toggleMaximizedAuxiliaryBar()`.

If the auxiliary bar is **not** considered maximized, it falls back to `toggleMaximizedPanel()`.

**Problem:** `toggleMaximizedPanel()` decides direction via `const maximize = !this.isPanelMaximized()` (`layout.ts`). For **horizontal panel + non-center alignment** (including **Justify**), `isPanelMaximized()` is defined to return **false** (see comments around `isPanelMaximized` and `panelOpensMaximized`: non-center horizontal alignment does not use the same “maximized panel” model). In that configuration, `toggleMaximizedPanel()` therefore interprets state as “not maximized” and takes the branch that calls **`setEditorHidden(true)`**—i.e. it **hides the editor** right after an editor became visible, which surfaces the **panel (terminal)** and fights the command that opened Welcome/Settings.

That matches the reported symptom (“pops my terminal”) and the follow-on broken panel chrome (“X does nothing”) when parts are driven into an inconsistent combination of hidden editor area and visible panel.

## Proposed Fix

### Option A: Targeted Fix (Recommended)

**Affected Files:**

- `src/vs/workbench/browser/layout.ts`

**Changes Required:**

1. **Adjust `showEditorIfHidden`** so that when the goal is to **show** the main editor because `mainPartEditorService` has visible editors but the editor part is not visible, the code does **not** call `toggleMaximizedPanel()` in situations where panel “maximize” semantics are undefined for the current **panel alignment** (non-center horizontal, e.g. justify).

   Concretely, in the `else` branch (auxiliary bar not maximized), prefer a path that **reveals the editor** when the editor is hidden:

   - Either call **`setEditorHidden(false)`** (which already coordinates with `setAuxiliaryBarMaximized(false)` at the start of `setEditorHidden`) and, if needed, apply the same **panel resize** logic as the `else` branch of `toggleMaximizedPanel()` so the panel returns to a non–full-bleed size where applicable; **or**
   - Introduce a small helper e.g. `revealMainEditorPreservingPanelState()` that encodes “unhide editor + restore panel dimensions” without using `toggleMaximizedPanel()` when `isPanelMaximized()` cannot reflect justify layouts.

2. **Optional hardening:** Extend **`isPanelMaximized()`** (or add `shouldTreatPanelAsCoveringEditor()`) so that when **panel alignment is not center** and **horizontal**, the workbench can still detect “editor area effectively hidden” in a way consistent with `setEditorHidden` / grid state, **or** explicitly document that `toggleMaximizedPanel()` must not be used from `showEditorIfHidden` for that alignment.

**Code Sketch (illustrative — exact structure should match surrounding style):**

```typescript
// Inside showEditorIfHidden, replace the else branch that only calls toggleMaximizedPanel():
} else {
    // Non-center horizontal panel (e.g. justify): isPanelMaximized() is always false,
    // so toggleMaximizedPanel() would maximize (hide editor) — wrong direction.
    if (this.getPanelAlignment() !== 'center' && isHorizontal(this.getPanelPosition())) {
        this.setEditorHidden(false);
        // If needed, mirror toggleMaximizedPanel's false-branch panel resize from current size state.
    } else {
        this.toggleMaximizedPanel();
    }
}
```

(Exact conditions and resize behavior should be validated against `toggleMaximizedPanel` and `setEditorHidden` so panel sizes and `PANEL_WAS_LAST_MAXIMIZED` stay coherent.)

### Option B: Comprehensive Fix (Optional)

Unify **panel maximize** and **editor visibility** semantics across all **PanelAlignment** values so `toggleMaximizedPanel` and `isPanelMaximized` cannot disagree for justify/widen layouts. This is a larger refactor with higher regression risk; prefer Option A unless product owners want full alignment support for “maximized panel” in justify mode.

## Confidence Level: Medium

**Reasoning:** The chain from `onDidVisibleEditorsChange` → `showEditorIfHidden` → `toggleMaximizedPanel` → `isPanelMaximized` is direct. The issue’s **Justify** detail aligns with known guards in `layout.ts` that **disable** classical panel maximization for non-center horizontal panels, which makes `toggleMaximizedPanel()` a hazardous default for that branch. Medium (not high) confidence because auxiliary-bar vs. panel ordering and timing with `forceMaximized` should be validated in a running Agent Sessions window.

**Validation:** After a fix, in Agent Sessions workspace with **Justify** panel alignment and terminal in the panel, run **Help: Welcome** and **Preferences: Open Settings (UI)**; the welcome/settings editor should stay in the main editor area, the terminal should not replace it spuriously, and the panel close control should still work.
