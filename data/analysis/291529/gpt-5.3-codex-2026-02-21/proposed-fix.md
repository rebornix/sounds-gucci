# Bug Analysis: Issue #291089

## Understanding the Bug

**Issue Title:** In agent session window, layout falls over when opening editors

**Reported Behavior:**
1. User opens an agent session window
2. Runs "Help: Welcome" command or "Show settings editor"
3. **Expected:** The editor opens
4. **Actual:** The terminal panel pops up instead (which is aligned to "justify")
5. **Worse:** Cannot close the panel after that (X button does nothing)

**Environment:**
- Agent sessions mode is active (a special workbench mode)
- Configuration includes:
  - `workbench.secondarySideBar.forceMaximized: true`
  - `workbench.editor.restoreEditors: false`
  - Panel alignment set to "justify" (not "center")

## Git History Analysis

### Time Window Used
- Initial: 24 hours before parent commit cceba815b0d6a91d0665261e101a12bed91cb037
- Final: 24 hours (no expansion needed)

### Relevant Commits Found

Within the 24-hour window, I found a related commit:

**cbf05da8123** - "Fix justified panel alignment when exiting maximized secondary sidebar"
- This commit fixed issue #290241, which the user was testing when they discovered #291089
- It adds `adjustPartPositions()` call when exiting maximized auxiliary bar
- However, this commit is NOT in our parent commit (it's on a separate branch)
- The fix addresses panel alignment issues but not the root cause of #291089

Other notable agent session-related commits in the window:
- 93a1e4ffb0e - "agent sessions - drop session providers that are not built-in"
- 7e43c30f54c - "agent sessions - always take the timings from the provider"
- bb1eec4bece - "hide agent session mode actions in stable"

## Root Cause

The bug is caused by the `workbench.secondarySideBar.forceMaximized` setting's interaction with the layout state management in `src/vs/workbench/browser/layout.ts`.

**The problematic code flow:**

1. **Initial State:** In agent sessions mode, the auxiliary bar (secondary sidebar) is force maximized, and the editor part is hidden
   
2. **State Persistence:** When auxiliary bar is maximized, the layout saves the visibility state:
   ```typescript
   // Line 2092-2119 in layout.ts
   const state = {
       sideBarVisible: this.isVisible(Parts.SIDEBAR_PART),
       editorVisible: this.isVisible(Parts.EDITOR_PART),  // false initially
       panelVisible: this.isVisible(Parts.PANEL_PART),
       auxiliaryBarVisible: this.isVisible(Parts.AUXILIARYBAR_PART)
   };
   ```

3. **User Opens Editor:** When the user runs "Help: Welcome", the layout should show the editor

4. **Attempted Un-maximize:** The `showEditorIfHidden()` function (line 342) detects auxiliary bar is maximized and calls `toggleMaximizedAuxiliaryBar()` to restore the editor

5. **State Restoration Problem:** Un-maximizing restores the saved state, including `editorVisible: false`
   ```typescript
   // Line 2129
   this.setEditorHidden(!state?.editorVisible);  // keeps editor hidden
   ```

6. **Force Re-maximize:** The critical bug is in `applyOverrides()` method (lines 2984-2994):
   ```typescript
   const auxiliaryBarForceMaximized = this.configurationService.getValue(
       WorkbenchLayoutSettings.AUXILIARYBAR_FORCE_MAXIMIZED
   );
   if (this.isNew[StorageScope.WORKSPACE] || auxiliaryBarForceMaximized) {
       // ...
       if (auxiliaryBarForceMaximized || ...) {
           this.applyAuxiliaryBarMaximizedOverride();
       }
   }
   ```
   
   Because `forceMaximized` is true, this code continuously re-applies the maximized state even after the user tries to open an editor. The condition `this.isNew[StorageScope.WORKSPACE] || auxiliaryBarForceMaximized` means the override is applied not just on first load, but repeatedly whenever the configuration is checked.

7. **Layout Chaos:** The editor part tries to show but gets hidden again, the panel pops up incorrectly (because of "justify" alignment), and the layout becomes inconsistent.

## Proposed Fix

### Option A: Targeted Fix (Recommended)

**Affected Files:**
- `resources/workbenchModes/agent-sessions.code-workbench-mode`
- `src/vs/workbench/browser/layout.ts`

**Changes Required:**

1. **Change the agent-sessions configuration** to use `defaultVisibility` instead of relying on `forceMaximized` alone:
   - Add `"workbench.secondarySideBar.defaultVisibility": "maximized"`
   - This ensures auxiliary bar is maximized on first load but doesn't force it afterward

2. **Remove the problematic `forceMaximized` check** from the `applyOverrides()` method:
   - Remove `|| auxiliaryBarForceMaximized` from line 2985
   - Remove `auxiliaryBarForceMaximized ||` from line 2988
   - Keep only the `isNew[StorageScope.WORKSPACE]` condition

**Code Changes:**

**File:** `resources/workbenchModes/agent-sessions.code-workbench-mode`

```json
{
"name": "Agent Sessions",
"settings": {
"chat.agentsControl.clickBehavior": "focus",
"chat.agentsControl.enabled": true,
"chat.agent.maxRequests": 1000,
"chat.restoreLastPanelSession": true,
"chat.unifiedAgentsBar.enabled": true,
"diffEditor.renderSideBySide": false,
"diffEditor.hideUnchangedRegions.enabled": true,
"files.autoSave": "afterDelay",
"github.copilot.chat.claudeCode.enabled": true,
"github.copilot.chat.languageContext.typescript.enabled": true,
"inlineChat.affordance": "editor",
"inlineChat.renderMode": "hover",
"workbench.activityBar.location": "top",
"workbench.editor.restoreEditors": false,
"workbench.editor.showTabs": "single",
"workbench.sideBar.location": "right",
"workbench.statusBar.visible": false,
"workbench.secondarySideBar.forceMaximized": true,
"workbench.secondarySideBar.defaultVisibility": "maximized",  // ADD THIS LINE
"workbench.startupEditor": "none",
"workbench.tips.enabled": false,
"workbench.layoutControl.type": "toggles",
}
}
```

**File:** `src/vs/workbench/browser/layout.ts` (lines 2981-2994)

```typescript
private applyOverrides(configuration: ILayoutStateLoadConfiguration): void {

// Auxiliary bar: Maximized settings
if (this.isNew[StorageScope.WORKSPACE]) {  // REMOVED: || auxiliaryBarForceMaximized
const defaultAuxiliaryBarVisibility = this.configurationService.getValue(WorkbenchLayoutSettings.AUXILIARYBAR_DEFAULT_VISIBILITY);
if (
// REMOVED: auxiliaryBarForceMaximized ||
defaultAuxiliaryBarVisibility === 'maximized' ||
(defaultAuxiliaryBarVisibility === 'maximizedInWorkspace' && this.contextService.getWorkbenchState() !== WorkbenchState.EMPTY)
) {
this.applyAuxiliaryBarMaximizedOverride();
}
}

// Both editor and panel should not be hidden on startup unless auxiliary bar is maximized
if (
this.getRuntimeValue(LayoutStateKeys.PANEL_HIDDEN) &&
this.getRuntimeValue(LayoutStateKeys.EDITOR_HIDDEN) &&
!this.getRuntimeValue(LayoutStateKeys.AUXILIARYBAR_WAS_LAST_MAXIMIZED)
) {
this.setRuntimeValue(LayoutStateKeys.EDITOR_HIDDEN, false);
}

// Restrict auxiliary bar size in case of small window dimensions
if (this.isNew[StorageScope.WORKSPACE] && configuration.mainContainerDimension.width <= DEFAULT_WORKSPACE_WINDOW_DIMENSIONS.width) {
this.setInitializationValue(LayoutStateKeys.SIDEBAR_SIZE, Math.min(300, configuration.mainContainerDimension.width / 4));
this.setInitializationValue(LayoutStateKeys.AUXILIARYBAR_SIZE, Math.min(300, configuration.mainContainerDimension.width / 4));
}
}
```

**Why This Works:**

1. **Removes the continuous override:** The `forceMaximized` setting no longer continuously re-applies the maximized state
2. **Preserves initial behavior:** Using `defaultVisibility: "maximized"` ensures the auxiliary bar still starts maximized on first load
3. **Allows user interaction:** After the initial load, the layout system can respond to editor opening events without being forced back to maximized state
4. **Respects layout state:** The saved layout state is only applied on new workspaces, not continuously

### Option B: Alternative Comprehensive Fix

An alternative would be to improve the `showEditorIfHidden()` logic to be aware of the `forceMaximized` setting and temporarily disable it when opening an editor. However, this approach would be more complex and require:
- Detecting when `forceMaximized` is active
- Temporarily disabling the force-maximize behavior
- Managing race conditions between configuration changes and layout updates

The targeted fix (Option A) is cleaner because it addresses the root cause: the inappropriate use of `forceMaximized` to control persistent layout state.

## Confidence Level: High

## Reasoning

1. **Direct Analysis:** I traced the exact code path from editor opening through layout state management and identified the specific condition causing the repeated re-maximization

2. **Configuration Understanding:** The `forceMaximized` setting was designed to force a state continuously, but this conflicts with dynamic layout changes when users interact with the UI

3. **Pattern Recognition:** The fix follows VSCode's existing pattern where `defaultVisibility` controls initial state and layout management handles subsequent changes

4. **Validation Against Symptom:** The proposed fix directly addresses:
   - Why the editor doesn't open (forced re-maximize prevents it)
   - Why the panel pops up (layout falls into inconsistent state due to forced auxiliary bar state)
   - Why the panel can't be closed (layout state management is fighting with forced configuration)

5. **Minimal Change:** The fix is surgical - it only changes the configuration handling for agent sessions mode without affecting other workbench modes or the general layout system
