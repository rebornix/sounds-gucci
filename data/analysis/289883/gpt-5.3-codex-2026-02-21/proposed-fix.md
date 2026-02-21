# Bug Analysis: Issue #289680

## Understanding the Bug

**Issue:** Agent sessions sash can hide the side-by-side when sized small

**Expected Behavior:** When the user drags the sash for the side-by-side agent sessions view to a very small size, the side-by-side view should automatically hide/collapse, similar to how VS Code hides sidebars when their sash is dragged to a minimal size.

**Current Behavior:** The side-by-side sessions view can be resized via the sash, but it does not automatically hide when dragged to a very small size. The sash just constrains the width to the minimum (`SESSIONS_SIDEBAR_MIN_WIDTH = 200`), but the sidebar remains visible even when it becomes impractically small.

**User Story:** As mentioned by @TylerLeonhardt in the issue, this feature should work "similar to how we hide sidebars when sash moves to a small size." The comment from @bpasero clarifies the expected behavior: "Drag the side by side sessions view enough to hide it."

## Git History Analysis

### Time Window Used
- Initial: 24 hours before parent commit (2026-01-22T12:04:11Z to 2026-01-23T12:04:11Z)
- Final: 24 hours (no expansion needed - found relevant context)

### Relevant Commits Found

1. **Commit a9645cc425a** (Jan 23, 2026 - within 24h window)
   - Message: "Agent sessions: consider to hide the New Button when size is limited (fix #289681)"
   - File: `src/vs/workbench/contrib/chat/browser/widgetHosts/viewPane/media/chatViewPane.css`
   - Changes: Added CSS to hide the new session button in panel location when space is constrained
   - **Relevance:** This shows the pattern for hiding UI elements when size is limited. Issue #289681 is a sibling issue to #289680, both dealing with size constraints in agent sessions UI.

2. **Commit 5265b9f1085** (Jan 23, 2026)
   - Message: "agent sessions - update default settings for profile"
   - Shows active development on agent sessions feature

3. **General observation:** Multiple commits in the 24h window show active work on agent sessions, particularly around UI sizing and orientation (stacked vs. side-by-side).

## Root Cause

The current implementation in `chatViewPane.ts` handles sash dragging for the side-by-side sessions view, but it only updates the width of the sessions sidebar. It does not implement any "snap-to-hide" or automatic hiding behavior when the width becomes impractically small.

**Key code location:** `src/vs/workbench/contrib/chat/browser/widgetHosts/viewPane/chatViewPane.ts`

The `createSideBySideSash` method (lines 965-1003) handles sash events:
- `onDidChange`: Updates `sessionsViewerSidebarWidth` with the new width, constrained by `computeEffectiveSideBySideSessionsSidebarWidth`
- The constraint only enforces a minimum of `SESSIONS_SIDEBAR_MIN_WIDTH` (200px)
- **Missing:** Logic to detect when width becomes too small and switch to hidden/stacked orientation

The `computeEffectiveSideBySideSessionsSidebarWidth` method enforces:
- Minimum: `SESSIONS_SIDEBAR_MIN_WIDTH` (200px)
- Maximum: `width - CHAT_WIDGET_DEFAULT_WIDTH` (to keep chat widget at least 300px)

**The gap:** There's no threshold below which the side-by-side view automatically collapses or hides.

## Proposed Fix

### Option A: Snap-to-Hide on Sash Drag (Recommended)

This is the minimal, targeted fix that directly addresses the user's request to "hide the side-by-side when sized small."

**Affected Files:**
- `src/vs/workbench/contrib/chat/browser/widgetHosts/viewPane/chatViewPane.ts`

**Changes Required:**

Add logic in the `onDidChange` handler of the side-by-side sash to detect when the user drags the sash close to the minimum threshold, and automatically hide the sessions sidebar by switching to stacked orientation.

**Implementation approach:**

1. Define a hide threshold (e.g., `SESSIONS_SIDEBAR_MIN_WIDTH + 50` = 250px, or even just slightly above the minimum)
2. In the `onDidChange` handler, check if the new width falls below this threshold
3. If yes, hide the sessions sidebar by switching to stacked orientation
4. Store this choice so it persists

**Code Sketch:**

```typescript
// In chatViewPane.ts, add a constant near the other SESSIONS_* constants (around line 320)
private static readonly SESSIONS_SIDEBAR_HIDE_THRESHOLD = 250; // Width below which we auto-hide

// Modify the createSideBySideSash method's onDidChange handler (around line 982)
disposables.add(sash.onDidChange(e => {
	if (sashStartWidth === undefined || !this.lastDimensions) {
		return;
	}

	const { position } = this.getViewPositionAndLocation();
	const delta = e.currentX - e.startX;
	const newWidth = position === Position.RIGHT ? sashStartWidth - delta : sashStartWidth + delta;

	// Check if user is dragging to hide
	if (newWidth < ChatViewPane.SESSIONS_SIDEBAR_HIDE_THRESHOLD) {
		// Hide by switching to stacked orientation
		this.sessionsViewerOrientation = AgentSessionsViewerOrientation.Stacked;
		this.relayout();
		return;
	}

	this.sessionsViewerSidebarWidth = this.computeEffectiveSideBySideSessionsSidebarWidth(this.lastDimensions.width, newWidth);
	this.viewState.sessionsSidebarWidth = this.sessionsViewerSidebarWidth;

	this.layoutBody(this.lastDimensions.height, this.lastDimensions.width);
}));
```

**Why this works:**
- When the user drags the sash to make the sidebar very small (below threshold), it automatically switches to stacked orientation
- This effectively "hides" the side-by-side view as requested
- The behavior is intuitive: dragging the sash all the way causes it to collapse, just like sidebars in VS Code
- Minimal code change - just a few lines in the sash handler

**Trade-offs:**
- The user loses their previous sidebar width preference when hiding
- To show side-by-side again, they would need to manually toggle the orientation (unless we add reverse logic)

### Option B: Bidirectional Snap-to-Hide/Show (Comprehensive)

This is a more complete solution that handles both hiding when dragged small AND showing again when there's enough space.

**Changes Required:**

Same file, but with additional logic:

1. Add the hide threshold as in Option A
2. When dragging small, switch to stacked orientation
3. When in stacked orientation and window width increases significantly, automatically switch back to side-by-side

**Code Sketch:**

```typescript
// Add constant for auto-show threshold
private static readonly SESSIONS_SIDEBAR_AUTO_SHOW_WIDTH = ChatViewPane.SESSIONS_SIDEBAR_VIEW_MIN_WIDTH; // 600px

// In createSideBySideSash's onDidChange (as in Option A)
// ... hide logic when dragging small ...

// In layoutBody method, add logic to auto-restore side-by-side when space available
// (around line 904, in the section that handles orientation)
if (this.sessionsViewerOrientation === AgentSessionsViewerOrientation.Stacked && 
    width >= ChatViewPane.SESSIONS_SIDEBAR_AUTO_SHOW_WIDTH) {
	// Automatically show side-by-side when there's enough space
	this.sessionsViewerOrientation = AgentSessionsViewerOrientation.SideBySide;
	// Continue with layout...
}
```

**Trade-offs:**
- More complex logic
- Might cause unexpected orientation switches when resizing the window
- Requires careful state management to avoid conflicts with user's explicit orientation preference

## Confidence Level: High

## Reasoning

**Why this fix addresses the root cause:**

1. **Direct symptom match:** The issue explicitly asks to "hide the side-by-side when sized small" by dragging the sash. Option A directly implements this by detecting when the sash is dragged to a small width and hiding the sidebar.

2. **Follows existing patterns:** 
   - Commit a9645cc425a shows the codebase already uses size-based hiding (hiding the New Button in constrained panel layouts)
   - The issue mentions following the pattern of how "we hide sidebars when sash moves to a small size"
   - VS Code commonly uses this UX pattern throughout

3. **Minimal intervention:** The fix requires only a small threshold check and orientation switch - no architectural changes needed.

4. **Validation:** 
   - The specific symptom ("drag the side by side sessions view enough to hide it") would be resolved
   - The file touched (`chatViewPane.ts`) is the right place - it already handles all sash interactions for sessions
   - The method modified (`createSideBySideSash`) is exactly where sash drag events are processed

**Why Option A is recommended:**

- **Simplest correct solution:** A threshold check and orientation switch is ~7 lines of code
- **User's intent is clear:** The issue asks for hiding when dragged small, not bidirectional behavior
- **Proven pattern:** Similar to how sidebar sashes work - drag small to hide
- **Maintainable:** Simple logic, easy to understand and test

**Potential consideration:**

The fix assumes that switching to `AgentSessionsViewerOrientation.Stacked` is the appropriate way to "hide" the side-by-side view. If the requirement is to hide the sessions view entirely (not just switch orientation), we might need to:
- Add a visibility toggle for the entire sessions container
- Or use a different mechanism to collapse the sidebar completely

However, based on the context that the issue says "similar to how we hide sidebars," and the fact that the codebase already has stacked as an alternative orientation, switching to stacked is likely the intended behavior.
