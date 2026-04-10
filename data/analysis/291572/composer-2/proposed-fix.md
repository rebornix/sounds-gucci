# Bug Analysis: Issue #290790

## Understanding the Bug

- **Expected:** Archiving a single agent session in the Chat **welcome / stacked sessions** experience should remove or relocate only that session (typically into an archived state the user can still find).
- **Actual:** After archiving one session from a **2×2-style grid** of four sessions, **two** sessions vanish together (“the whole row”). A separate cosmetic issue: the **focus outline** extends past the visible surface.

- **Repro (from issue):** TPI setup → four sessions in a grid → archive one → two sessions disappear; focus border overflow also visible in the demo.

## Git History Analysis

- **Parent commit:** `a0fddd4145fa25afde14b23487d7108e6347e4d7`
- **Time window:** Started with 24h before parent, expanded to 7 days on `src/vs/workbench/contrib/chat/browser/agentSessions/` and related view-pane paths.
- **Result:** No commits in that window touching `agentSessions/` at this snapshot (likely the regression or feature work landed earlier). Investigation relied on **static analysis** of the parent tree.

### Time Window Used

- Initial: 24 hours before parent  
- Final: **7 days** (expanded; still no relevant commits in `agentSessions/` for this window)

## Root Cause

Multiple plausible, code-backed causes; the strongest are:

### 1. Multi-selection + context menu archives more than one session

In `agentSessionsControl.ts`, the context menu builds `IMarshalledAgentSessionContext` so that when **more than one** session is selected and the menu is opened on one of them, **`sessions` is the full selection**, not only the row under the pointer:

```283:287:/Users/penlv/Code/Work/vscode2/src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsControl.ts
		const selection = this.sessionsList?.getSelection().filter(isAgentSession) ?? [];
		const marshalledContext: IMarshalledAgentSessionContext = {
			session,
			sessions: selection.length > 1 && selection.includes(session) ? selection : [session],
```

`ArchiveAgentSessionAction` then runs `setArchived(true)` for **every** session in that array. A **2×2 grid** mental model often pairs “row neighbors”; if two adjacent cells stay selected (e.g. range selection, shift-click, or platform list behavior), **one** Archive action removes **two** sessions — matching “whole row disappears.”

### 2. Capped grouping + archived filter hides archived sessions entirely

Stacked orientation uses **capped** grouping (`chatViewPane.ts` → `AgentSessionsGrouping.Capped`). For archived sessions, the filter can **exclude** them from the tree when capped has no archived section:

```292:294:/Users/penlv/Code/Work/vscode2/src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsFilter.ts
		if (this.excludes.archived && this.groupResults?.() === AgentSessionsGrouping.Capped && session.isArchived()) {
			return true; // exclude archived sessions when grouped by capped where we have no "Archived" group
```

That makes archived sessions **disappear** from the list rather than appear under a dedicated “Archived” group (unlike date grouping). That alone explains **one** missing session; **two** missing sessions still align best with **(1)** or with a **layout/focus** bug that hides an extra row.

### 3. Focus outline overflow (secondary)

Session rows use **outline** on inner content when selected (e.g. diff/badge styling in `agentsessionsviewer.css`). Combined with `overflow` and flex layout in the chat pane / list, the focus ring can extend outside the clipped viewport — consistent with “focus border extends beyond visible surface.”

## Proposed Fix

### Option A: Targeted Fix (Recommended)

**Affected files:**

- `src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsControl.ts`
- (Optional) `src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsActions.ts`
- (Optional, UX parity) `src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsFilter.ts` + `agentSessionsViewer.ts` (`groupSessionsCapped`)

**Changes Required:**

1. **Single-session archive from row context menu / toolbar**  
   When the user invokes **Archive** from the **session row** (toolbar or context menu anchored to one session), pass **only that session** as the actionable list unless the command is explicitly a **“archive N selected”** bulk action. Concretely: change marshalling so `sessions` is `[session]` for `MenuId.AgentSessionsContext` / item toolbar, **or** teach `BaseAgentSessionAction` / `ArchiveAgentSessionAction` to use `context.session` only when the intent is single-row archive.  
   **Validates:** Archiving one cell never archives a second selected session unless the user clearly selected multiple on purpose.

2. **Capped mode: show archived sessions in a collapsible group**  
   Extend `groupSessionsCapped` to append an **Archived** section (same idea as `groupSessionsByDate`), **or** stop excluding archived in `exclude()` when `groupResults === Capped`, and rely on a small archived section + collapse state.  
   **Validates:** After archiving, the session remains discoverable instead of vanishing from capped view.

3. **Focus overflow**  
   In `agentsessionsviewer.css` (and/or parent `.agent-sessions-control-container`), add `overflow: hidden` on the list viewport where appropriate, or switch inner **outline** to **box-shadow** / `outline-offset` inside the row so focus stays within bounds.

**Code sketch (conceptual):**

```typescript
// agentSessionsControl.ts — prefer single target for destructive session actions
const marshalledContext: IMarshalledAgentSessionContext = {
  session,
  sessions: [session], // or split: bulk vs single via menu id / modifier
  $mid: MarshalledId.AgentSessionContext
};
// If true multi-archive is desired, use a dedicated action id / context flag.
```

### Option B: Comprehensive Fix (Optional)

- Add explicit **“Archive selected (N)”** with confirmation when `selection.length > 1`.  
- Unify capped vs date grouping so **Archived** behavior and filter semantics match across orientations (less surprise, easier testing).

## Confidence Level: Medium

## Reasoning

- **Two** sessions disappearing after **one** archive is strongly explained by **multi-selection** feeding multiple URIs into `ArchiveAgentSessionAction` — behavior is explicit in the control + action pipeline.  
- **Capped + exclude archived** explains harsh disappearance of archived items and should be fixed for parity with date-grouped UI.  
- Focus overflow matches list/CSS patterns in `agentsessionsviewer.css` and stacked chat layout.  
- PR title (“Agents **welcome view** UI fixes”) aligns with layout/focus and stacked welcome + sessions chrome; file-level mapping should be confirmed against the real PR diff during validation (not consulted here).
