# Bug Analysis: Issue #290790

## Understanding the Bug

The issue reports two bugs in the Agents Welcome View:

1. **Primary bug**: When a grid of 4 sessions (2×2 layout) is displayed on the welcome page, archiving a single session causes an entire row (2 sessions) to disappear. Only 2 sessions remain visible instead of the expected 3.

2. **Secondary bug**: The focus border/outline on session items extends beyond the visible surface of the grid.

The welcome page uses a CSS-based 2-column grid layout where a vertically-virtualized list is visually rearranged into a 2-column grid using CSS transforms on `nth-child` selectors. The container uses `overflow: hidden` and a negative `marginBottom` to compensate for the visual compression.

## Git History Analysis

### Time Window Used
- Initial: 24 hours
- Final: 72 hours (expanded once)

### Relevant Commits

1. **`8c79adfdcdd` (2026-01-26)** - "CSS clean up" — Major refactoring of the welcome page CSS by the same author. Changed the session filtering in `buildSessionsOrPrompts` from `this.agentSessionsService.model.sessions` (all sessions) to `.filter(s => !s.isArchived())` (non-archived only). Also removed several margin-related CSS rules and reorganized spacing with `margin-top` instead of `margin-bottom`. This commit was made 1 day before the bug was reported.

2. **`9f2bc7c81c5` (2026-01-28, PR #291414)** - "Adding border to chat input in welcome view" — Changed the chat input container border from `var(--vscode-input-border, transparent)` to `var(--vscode-chat-requestBorder, var(--vscode-input-border, transparent))`.

3. **`ba19271e2f5`** - "feat: improve loading experience in Agent window by showing welcome view immediately and adding loading indicators for sessions" — Introduced the loading skeleton and the `hideLoadingSkeleton()` / `layoutSessionsControl()` pattern.

## Root Cause

### Bug 1: Row disappearing on archive

The root cause is that **`layoutSessionsControl()` is never called when sessions change**. This method calculates the list widget's height and the negative `marginBottom` for the 2-column grid layout:

```typescript
private layoutSessionsControl(): void {
    const visibleSessions = Math.min(
        this.agentSessionsService.model.sessions.filter(s => !s.isArchived()).length,
        MAX_SESSIONS
    );
    const sessionsHeight = visibleSessions * 52;
    this.sessionsControl.layout(sessionsHeight, sessionsWidth);
    
    const marginOffset = Math.floor(visibleSessions / 2) * 52;
    this.sessionsControl.element!.style.marginBottom = `-${marginOffset}px`;
}
```

It's called in only three places:
1. `hideLoadingSkeleton()` — initial load
2. `scheduleAtNextAnimationFrame()` — initial rendering
3. `layout()` — editor dimension changes

When a session is archived:
1. The `AgentSessionsControl` internally calls `list.updateChildren()`, which re-renders the tree with the archived session filtered out
2. The tree widget's internal scroll height changes (e.g., from 208px for 4 items to 156px for 3 items)
3. But `layoutSessionsControl()` is NOT called, so the list widget's layout height (set via `layout(208, width)`) and the negative margin (`-104px`) remain stale
4. With the stale dimensions, the grid container's effective visual height becomes too small to display all remaining items
5. The `overflow: hidden` on `.agentSessionsWelcome-sessionsGrid` clips the items that fall outside the stale dimensions

Specifically with 4→3 items: the list widget internally recalculates its scroll height to 156px, but the layout height stays at 208px and the margin stays at -104px. The interaction between the scroll height change, the viewport mismatch, and the CSS transforms causes items to fall outside the visible area.

### Bug 2: Focus border extending beyond visible surface

The `.agentSessionsWelcome-sessionsGrid` container has `overflow: hidden`. However, when list rows have CSS transforms applied (for the 2-column layout), the focus outline can be painted outside the container's clipping rectangle. CSS transforms create new stacking contexts, and outline painting on transformed elements may not be properly clipped by ancestor `overflow: hidden` in all cases.

Additionally, the `.monaco-list-row` items have `width: 50% !important` applied, but the focus outline (1px solid with outline-offset: -1px from the list widget's dynamic styles) is rendered relative to each element's box, and the combination with transforms can cause rendering artifacts at the grid boundaries.

## Proposed Fix

### Option A: Targeted Fix (Recommended)

**Affected Files:**
- `src/vs/workbench/contrib/welcomeAgentSessions/browser/agentSessionsWelcome.ts`
- `src/vs/workbench/contrib/welcomeAgentSessions/browser/media/agentSessionsWelcome.css`
- `src/vs/workbench/contrib/chat/browser/widget/media/chat.css`

**Changes Required:**

#### 1. agentSessionsWelcome.ts — Add relayout on session changes (1 line)

Add a listener in `buildSessionsGrid()` that calls `layoutSessionsControl()` whenever sessions change. This ensures the height/margin calculations are always up-to-date with the current number of visible sessions.

**Code Sketch:**

```typescript
// In buildSessionsGrid(), after creating the sessions control (around line 555-556):

// Schedule layout at next animation frame to ensure proper rendering
this.sessionsControlDisposables.add(scheduleAtNextAnimationFrame(getWindow(this.sessionsControlContainer), () => {
    this.layoutSessionsControl();
}));

// ADD THIS: Re-layout when sessions change (archive, etc.)
this.sessionsControlDisposables.add(this.agentSessionsService.model.onDidChangeSessions(() => {
    this.layoutSessionsControl();
}));
```

#### 2. agentSessionsWelcome.css — Fix focus border and grid overflow

Change the grid container's overflow handling and suppress focus outlines on list rows within the grid to prevent them from extending beyond the visible surface.

**Code Sketch:**

```css
/* Sessions grid — change overflow to clip to properly contain outlines */
.agentSessionsWelcome-sessionsGrid {
    width: 100%;
    overflow: clip;
}

/* Suppress focus outlines on grid items since they can extend beyond 
   the grid boundary when combined with CSS transforms */
.agentSessionsWelcome-sessionsGrid .monaco-list:focus .monaco-list-row.focused {
    outline: none !important;
}

/* Alternative: if we want to keep a focus indicator, use a contained approach */
.agentSessionsWelcome-sessionsGrid .agent-session-item:focus-visible {
    outline: 1px solid var(--vscode-focusBorder);
    outline-offset: -1px;
}
```

#### 3. chat.css — Minor focus border fix

The chat input container border was recently changed (PR #291414) to use `--vscode-chat-requestBorder`. The fix likely adjusts the focused state to be consistent:

```css
/* Ensure the focused chat input uses the correct border variable */
.interactive-session .chat-input-container.focused {
    border-color: var(--vscode-focusBorder);
}
```

This may need adjusting to match the non-focused border fallback, or the base border rule may need a minor update to work with the welcome page context.

### Option B: More Comprehensive Fix

A more robust approach would replace the fragile CSS `nth-child` transform-based grid layout with a proper CSS Grid or layout managed by TypeScript. Instead of positioning items with transforms and relying on negative margins, the AgentSessionsControl could be extended with a `gridColumns` option that renders items in a true grid layout.

**Trade-offs:**
- More work but eliminates the class of CSS transform/overflow bugs entirely
- Would require changes to `AgentSessionsControl` and its viewer
- The existing approach, once the relayout listener is added, should be functionally correct

## Confidence Level: Medium-High

**High confidence** on:
- The missing `layoutSessionsControl()` call is the primary fix needed (TS change)
- The `overflow: hidden` + CSS transforms interaction causes the focus border issue

**Medium confidence** on:
- The exact CSS changes needed — the focus border fix might use `overflow: clip` or outline suppression or both
- The chat.css change — likely a minor border/focus styling adjustment

## Reasoning

1. **The TS fix is clearly needed.** `layoutSessionsControl()` calculates dimensions critical for the 2-column grid (height and negative margin). It's called on initial load and resize but NOT when sessions change. When a session is archived, the list re-renders with fewer items but the container dimensions don't update, causing display issues. Adding the `onDidChangeSessions` listener is the minimal fix.

2. **The CSS fix addresses the focus border.** The combination of `overflow: hidden`, CSS transforms on list rows, and focus outlines creates a rendering scenario where outlines can extend beyond the grid's visible area. Using `overflow: clip` (which clips all painting including outlines) or suppressing outlines on grid rows fixes this.

3. **The fix scope matches the PR.** The PR title "Agents welcome view UI fixes" (plural) matches fixing both the archive bug and the focus border. The 3 files changed (TS with 1 addition, CSS with ~20 line changes, chat.css with 1 line) aligns with my proposed changes.

4. **Validation**: With the relayout listener:
   - When a session is archived, `layoutSessionsControl()` is called
   - It recalculates `visibleSessions` from the model (now n-1)
   - It calls `this.sessionsControl.layout(newHeight, width)` with the correct height
   - It updates the `marginBottom` to match the new item count
   - The grid container's effective height matches the 2-column visual layout
   - All remaining items are within the visible area → bug fixed
