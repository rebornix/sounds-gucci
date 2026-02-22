# Bug Analysis: Issue #289680

## Understanding the Bug

The issue is a feature request from @bpasero (idea from @TylerLeonhardt): when dragging the sash that separates the side-by-side agent sessions view from the chat widget, if the user drags it small enough, the side-by-side sessions view should automatically hide — similar to how VS Code hides sidebars when their sash is moved to a small enough size.

Currently, the side-by-side sash's `onDidChange` handler clamps the sessions sidebar width to `SESSIONS_SIDEBAR_MIN_WIDTH` (200px) via `computeEffectiveSideBySideSessionsSidebarWidth()`. When the user drags the sash below that minimum, the width simply stays at 200px — the side-by-side view never hides. There is no snap-to-hide behavior.

## Git History Analysis

### Relevant Commits (24h window before parent commit)

- **`a9645cc425a`** - "Agent sessions: consider to hide the New Button when size is limited (fix #289681)" — Sibling issue fix by the same author. Added CSS to hide the "New Session" button in panel location. Shows the pattern of hiding UI elements when space is limited.
- **`5265b9f1085`** - "agent sessions - update default settings for profile" — Related agent sessions settings work.
- **`19209a8c1f2`** - "Prototype agent sessions window" — Agent sessions window setup.

### Time Window Used
- Initial: 24 hours
- Final: 24 hours (no expansion needed)

## Root Cause

In `createSideBySideSash()` (chatViewPane.ts, ~line 982), the `onDidChange` handler computes a new width when the sash is dragged but only clamps it to the minimum — it never switches to stacked orientation when the width goes below the minimum:

```typescript
disposables.add(sash.onDidChange(e => {
    // ...
    const newWidth = position === Position.RIGHT ? sashStartWidth - delta : sashStartWidth + delta;
    
    // This clamps to min width but never hides/switches orientation
    this.sessionsViewerSidebarWidth = this.computeEffectiveSideBySideSessionsSidebarWidth(this.lastDimensions.width, newWidth);
    this.viewState.sessionsSidebarWidth = this.sessionsViewerSidebarWidth;
    this.layoutBody(this.lastDimensions.height, this.lastDimensions.width);
}));
```

The `computeEffectiveSideBySideSessionsSidebarWidth()` enforces `Math.max(SESSIONS_SIDEBAR_MIN_WIDTH, ...)`, so the width bottoms out at 200px but the sessions view never collapses.

## Proposed Fix

### Option A: Targeted Fix (Recommended)

**Affected Files:**
- `src/vs/workbench/contrib/chat/browser/widgetHosts/viewPane/chatViewPane.ts`

**Changes Required:**

In the `createSideBySideSash` method, modify the `onDidChange` handler to check if the computed new width falls below `SESSIONS_SIDEBAR_MIN_WIDTH`. When it does, switch the sessions viewer orientation to `stacked`, effectively hiding the side-by-side view — analogous to how VS Code hides sidebars when their sash is dragged past the minimum size.

**Code Sketch:**

```typescript
disposables.add(sash.onDidChange(e => {
    if (sashStartWidth === undefined || !this.lastDimensions) {
        return;
    }

    const { position } = this.getViewPositionAndLocation();
    const delta = e.currentX - e.startX;
    const newWidth = position === Position.RIGHT ? sashStartWidth - delta : sashStartWidth + delta;

    // Snap to stacked when sash is dragged below min width (hide side-by-side)
    if (newWidth < ChatViewPane.SESSIONS_SIDEBAR_MIN_WIDTH) {
        this.updateConfiguredSessionsViewerOrientation('stacked');
        return;
    }

    this.sessionsViewerSidebarWidth = this.computeEffectiveSideBySideSessionsSidebarWidth(this.lastDimensions.width, newWidth);
    this.viewState.sessionsSidebarWidth = this.sessionsViewerSidebarWidth;

    this.layoutBody(this.lastDimensions.height, this.lastDimensions.width);
}));
```

The orientation change triggers `relayout()` which destroys and recreates the sash for the new (stacked) orientation, so the drag naturally terminates. This provides an immediate snap-to-hide effect.

## Confidence Level: High

## Reasoning

1. **The pattern is established.** The orientation switching infrastructure already exists — `updateConfiguredSessionsViewerOrientation` handles configuration persistence, relayout, and sash recreation. The `layoutSessionsControl` method already switches from side-by-side to stacked when the overall view width falls below `SESSIONS_SIDEBAR_VIEW_MIN_WIDTH`. This fix extends that snap behavior to the sash drag gesture.

2. **The mechanism is clean.** When orientation switches during a drag, `layoutSessionsControl` clears the sash disposables (`sessionsViewerSashDisposables.clear()`) and recreates the sash for the new orientation. This naturally terminates the current drag gesture.

3. **Minimal change.** Adding a single condition before the width assignment is the smallest correct fix — one `if` check and one method call.

4. **Validates against the symptom.** The user drags the side-by-side sash to make the sessions sidebar very small → width goes below 200px → orientation switches to stacked → the side-by-side view is hidden. This exactly matches the requested behavior: "similar to how we hide sidebars when sash moves to a small size."
