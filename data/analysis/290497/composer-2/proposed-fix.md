# Bug Analysis: Issue #290352

## Understanding the Bug

In the Chat view, users can filter the agent sessions list via the filter menu (session status: Completed, In Progress, Input Needed, Failed, etc.). Expected behavior: each toggle adds or removes that status from the exclude list so multiple filters compose. Actual behavior: after changing one session-status filter, a **second** change resets filters instead of applying cumulatively. The issue **only** reproduces when filtering on session status. Maintainer comment: behavior is tied to the **agent status control** (title bar); turning that off avoids the bug.

## Git History Analysis

`parentCommit` is `381de2d9802d6caac6d35a3c474a67aff8753739` (2026-01-26). A 7-day window before the parent yields only that commit on the tip—no additional local signal. Investigation focused on code paths that share **profile storage** with `AgentSessionsFilter` and run on filter changes.

### Time Window Used

- Initial: 24 hours (empty before parent)
- Final: 7 days (still only parent on that file’s short log)

## Root Cause

`AgentSessionsFilter` persists excludes under  
`agentSessions.filterExcludes.<filterMenuId>`, which for the chat sessions viewer resolves to `agentSessions.filterExcludes.agentsessionsviewerfiltersubmenu`.

`AgentTitleBarStatusWidget` (agent status experiment) uses the **same** `FILTER_STORAGE_KEY` for badge-driven filters (“unread”, “in progress”) and listens to storage changes to re-render.

In `_getCurrentFilterState()`, **“filtered to in-progress”** is inferred heuristically as:

```typescript
const isFilteredToInProgress = filter.states?.length === 2 && filter.read === false;
```

The real in-progress **badge** filter written by `_openSessionsWithFilter('inProgress')` excludes exactly **`Completed` and `Failed`**, but the heuristic matches **any** two excluded states with `read === false`.

So a normal user sequence such as:

1. Exclude **Completed** → `states.length === 1` (no false match)
2. Exclude **In Progress** → `states = [Completed, InProgress]`, length `2`, `read === false` → incorrectly classified as badge “in-progress” mode

On each status-badge render, `_clearFilterIfCategoryEmpty` runs:

- If `isFilteredToInProgress && !hasActiveSessions`, it calls `_restoreUserFilter()`.
- With no in-progress sessions in the model, `hasActiveSessions` is false while the false-positive heuristic is true → **restore/clear** runs and wipes the user’s manual filter (second action appears as a full reset).

This matches “only when filtering on session status” and the link to the agent status control.

## Proposed Fix

### Option A: Targeted Fix (Recommended)

**Affected file:**

- `src/vs/workbench/contrib/chat/browser/agentSessions/experiments/agentTitleBarStatusWidget.ts`

**Changes required:**

1. Replace the loose `states.length === 2` heuristic for `isFilteredToInProgress` with a **structural match** to the filter object produced by `_openSessionsWithFilter('inProgress')`: same `archived`/`read` flags as that path and `states` equal (as a set) to `[AgentSessionStatus.Completed, AgentSessionStatus.Failed]` (order-independent).
2. Optionally tighten `isFilteredToUnread` similarly: match `read === true`, `states.length === 0`, and the same `archived` value the unread badge path stores (`true`), so future combinations do not collide.

**Code sketch:**

```typescript
// Helper: true only for the exact "in progress badge" filter shape
function isInProgressBadgeFilter(filter: {
	providers: string[];
	states: AgentSessionStatus[];
	archived: boolean;
	read: boolean;
}): boolean {
	if (filter.read !== false || filter.archived !== true || filter.states.length !== 2) {
		return false;
	}
	const s = new Set(filter.states);
	return s.size === 2
		&& s.has(AgentSessionStatus.Completed)
		&& s.has(AgentSessionStatus.Failed);
}

// In _getCurrentFilterState():
const isFilteredToInProgress = isInProgressBadgeFilter(filter);
```

### Option B: Comprehensive Fix (Optional)

- Move badge vs. manual filter distinction to an explicit flag in stored JSON (e.g. `source: 'badge' | 'user'`) so heuristics are unnecessary. Higher churn and migration cost; only worth it if more badge modes are added.

## Confidence Level: High

## Reasoning

- Shared storage key ties the chat filter menu and the title-bar widget; maintainer comment points at agent status control.
- The heuristic `length === 2 && !read` necessarily collides with legitimate manual two-state excludes (e.g. Completed + In Progress).
- `_clearFilterIfCategoryEmpty` + `_restoreUserFilter()` explains a **reset on the second toggle** when no in-progress sessions exist, without requiring changes to `AgentSessionsFilter.ts` itself.
