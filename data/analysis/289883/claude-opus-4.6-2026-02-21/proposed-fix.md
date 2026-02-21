# Bug Analysis: Issue #289680

## Understanding the Bug

The issue is a feature request to add "snap-to-hide" behavior for the agent sessions side-by-side sash. Currently, when a user drags the sash divider in the side-by-side sessions view to make the sessions sidebar narrower, the sidebar stops at a minimum width of 200px (`SESSIONS_SIDEBAR_MIN_WIDTH`) and cannot be made smaller. The desired behavior (similar to how VS Code sidebars work) is that dragging the sash past the minimum size should **hide** (snap-close) the sessions sidebar entirely.

**Expected behavior:** Dragging the side-by-side sessions sash past the minimum width should hide the sessions panel.

**Actual behavior:** The sash stops at the minimum width (200px) and cannot collapse/hide the sessions panel.

## Git History Analysis

### Time Window Used
- Initial: 24 hours
- Final: 24 hours (no expansion needed)

### Relevant Commits Found

- **`a9645cc425a`** - "Agent sessions: consider to hide the New Button when size is limited (fix #289681)" — A closely related commit by the same author that hides UI elements when space is limited. This CSS-only fix hides the "new session" button in panel location. Filed the same day as our issue.
- **`5265b9f1085`** - "agent sessions - update default settings for profile" — Updates default agent session settings.
- **`19209a8c1f2`** - "Prototype agent sessions window" — Agent sessions window prototyping.

The key file is `src/vs/workbench/contrib/chat/browser/widgetHosts/viewPane/chatViewPane.ts`, which contains all the sash creation and layout logic for the sessions sidebar.

## Root Cause

In the `createSideBySideSash` method (line 965), the `onDidChange` handler computes the new width and passes it through `computeEffectiveSideBySideSessionsSidebarWidth`, which enforces a hard minimum via:

```typescript
private computeEffectiveSideBySideSessionsSidebarWidth(width: number, sessionsViewerSidebarWidth = this.sessionsViewerSidebarWidth): number {
    return Math.max(
        ChatViewPane.SESSIONS_SIDEBAR_MIN_WIDTH,  // clamped to 200px minimum
        Math.min(
            sessionsViewerSidebarWidth,
            width - ChatViewPane.CHAT_WIDGET_DEFAULT_WIDTH
        )
    );
}
```

The `Math.max(SESSIONS_SIDEBAR_MIN_WIDTH, ...)` prevents the sidebar from ever being smaller than 200px. There is no code path that detects when the user drags past this minimum to trigger a "snap to hide" behavior.

## Proposed Fix

### Option A: Targeted Fix (Recommended)

**Affected Files:**
- `src/vs/workbench/contrib/chat/browser/widgetHosts/viewPane/chatViewPane.ts`

**Changes Required:**

1. **Add a `sessionsViewerHiddenBySash` flag** to track when the sessions sidebar was hidden by sash interaction.

2. **In `createSideBySideSash`'s `onDidChange` handler**, detect when the raw `newWidth` falls below `SESSIONS_SIDEBAR_MIN_WIDTH` and set the flag + trigger relayout to hide the sessions.

3. **In `updateSessionsControlVisibility`**, incorporate the flag so that when `sessionsViewerHiddenBySash` is true, the side-by-side sessions are hidden.

4. **In `createSideBySideSash`'s `onDidReset` handler** (double-click to reset), clear the flag and restore the default width.

5. **Clear the flag on orientation change** to avoid stale state when switching between stacked and side-by-side.

**Code Sketch:**

```typescript
// 1. Add the flag alongside other session viewer state (around line 341)
private sessionsViewerHiddenBySash = false;

// 2. Modify createSideBySideSash's onDidChange handler (line 982-995)
disposables.add(sash.onDidChange(e => {
    if (sashStartWidth === undefined || !this.lastDimensions) {
        return;
    }

    const { position } = this.getViewPositionAndLocation();
    const delta = e.currentX - e.startX;
    const newWidth = position === Position.RIGHT ? sashStartWidth - delta : sashStartWidth + delta;

    // Snap to hide when dragged below minimum width
    if (newWidth < ChatViewPane.SESSIONS_SIDEBAR_MIN_WIDTH) {
        this.sessionsViewerHiddenBySash = true;
        this.relayout();
        return;
    }

    this.sessionsViewerHiddenBySash = false;
    this.sessionsViewerSidebarWidth = this.computeEffectiveSideBySideSessionsSidebarWidth(this.lastDimensions.width, newWidth);
    this.viewState.sessionsSidebarWidth = this.sessionsViewerSidebarWidth;

    this.layoutBody(this.lastDimensions.height, this.lastDimensions.width);
}));

// 3. Modify onDidReset handler (line 997-1002)
disposables.add(sash.onDidReset(() => {
    this.sessionsViewerHiddenBySash = false;
    this.sessionsViewerSidebarWidth = ChatViewPane.SESSIONS_SIDEBAR_DEFAULT_WIDTH;
    this.viewState.sessionsSidebarWidth = this.sessionsViewerSidebarWidth;

    this.relayout();
}));

// 4. In updateSessionsControlVisibility (line 474-478), add the flag check
// Sessions control: sidebar
else {
    newSessionsContainerVisible =
        !this.sessionsViewerHiddenBySash &&                                                         // not hidden by sash
        !this.welcomeController?.isShowingWelcome.get() &&                                          // welcome not showing
        !!this.lastDimensions && this.lastDimensions.width >= ChatViewPane.SESSIONS_SIDEBAR_VIEW_MIN_WIDTH;
}

// 5. In layoutSessionsControl (around line 865), clear the flag on orientation change
if (oldSessionsViewerOrientation !== this.sessionsViewerOrientation) {
    this.sessionsViewerHiddenBySash = false;
    // ... existing code for orientation change
}
```

**How it works:**
- When the user drags the sash to make `newWidth < 200px`, the flag is set and `relayout()` is called
- `relayout()` → `layoutBody()` → `layoutSessionsControl()` → `updateSessionsControlVisibility()` sees the flag and returns `visible: false`
- This hides the sessions container and destroys the sash (existing behavior for hidden sessions)
- The sessions sidebar can be restored by:
  - Changing the sessions orientation setting
  - The view being resized to a width that triggers re-layout (orientation switch)
  - Any explicit action that clears the flag

### Option B: Also handle stacked orientation snap (Comprehensive)

The same snap-to-hide behavior could be applied to the **stacked** orientation sash (vertical drag to hide sessions when stacked on top). The `createStackedSash` method has the same pattern with `SESSIONS_STACKED_MIN_HEIGHT`. For consistency, the same flag or a separate `sessionsViewerStackedHiddenBySash` flag could be added.

However, the stacked mode is used when the view is narrow, and the sessions list in stacked mode already auto-hides based on chat widget empty state (line 466-470). Adding snap-to-hide for stacked mode may be over-engineering given its more limited use. The issue specifically mentions "side-by-side sessions," so this can be deferred.

## Confidence Level: High

## Reasoning

1. **Root cause is clear**: The `computeEffectiveSideBySideSessionsSidebarWidth` method enforces a hard minimum via `Math.max(SESSIONS_SIDEBAR_MIN_WIDTH, ...)`, and the `onDidChange` handler unconditionally applies this clamped value. There is no escape hatch to trigger a hide.

2. **Fix follows VS Code patterns**: The sidebar snap-to-hide in VS Code's workbench layout uses a similar concept (the `snap` property on views in the grid system). Since the agent sessions use a custom sash rather than the grid/splitview system, we implement the same behavior manually with a flag.

3. **Minimal change**: Only one file needs modification. The fix adds a single boolean flag and small checks in 3-4 locations, without changing any existing behavior when the sash is used normally (dragging within valid range).

4. **Mental trace validation**: 
   - User drags sash left (making sidebar narrower) past 200px → `newWidth < 200` → flag set → `relayout()` → `updateSessionsControlVisibility()` returns `visible: false` → sessions container hidden, sash destroyed → ✅ sessions sidebar disappears
   - User changes orientation setting → `layoutSessionsControl()` detects orientation change → flag cleared → on next layout, sessions appear in new orientation → ✅ restore works
   - Normal sash drag (staying above 200px) → flag stays false → existing behavior unchanged → ✅ no regression
