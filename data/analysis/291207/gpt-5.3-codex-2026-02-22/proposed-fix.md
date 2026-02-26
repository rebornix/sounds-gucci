# Bug Analysis: Issue #290858

## Understanding the Bug
The issue reports that agent sessions should be sorted only by modification date, but current behavior in the chat sessions UI can prioritize unread sessions over recency. This causes old unread sessions to appear near the top, which is surprising and makes ordering inconsistent with user expectations. A maintainer comment confirms this behavior was intentionally added for stacked mode (to surface unread items in a limited top section) and should now be reverted.

## Git History Analysis
I analyzed the repository at parent commit `a066abff0fe2962791823f757767d88f079a036c` and looked for recent context around chat sessions sorting.

- In the 24h / 3d / 7d windows ending at the parent commit, the log is sparse at this tip.
- Code-path tracing shows sorting is handled by `AgentSessionsSorter` in `agentSessionsViewer.ts` (default sort = status buckets + recency).
- The read/unread prioritization is introduced via `overrideCompare` passed from `chatViewPane.ts` when orientation is stacked.
- `git blame` on `chatViewPane.ts` lines around `overrideCompare` confirms the unread-first rule was added very recently (timestamp 2026-01-27), matching the timing and symptom.

### Time Window Used
- Initial: 24 hours
- Final: 168 hours (expanded 2 times)

## Root Cause
`ChatViewPane` injects a custom comparator for stacked sessions:

- If one session is unread and the other is read, unread is forced first.
- Only when read-state is equal does sorting fall back to recency in `AgentSessionsSorter`.

This overrides pure date-based ordering and can move old unread sessions above newer read sessions.

## Proposed Fix

### Option A: Targeted Fix (Recommended)
**Affected Files:**
- `src/vs/workbench/contrib/chat/browser/widgetHosts/viewPane/chatViewPane.ts`

**Changes Required:**
Remove the read/unread prioritization from `overrideCompare` in `createSessionsControl`, so the sorter always uses its default logic (needs-input/in-progress/archived grouping, then recency). Keep archived-at-end behavior unchanged.

**Code Sketch:**
```ts
overrideCompare: (_sessionA: IAgentSession, _sessionB: IAgentSession): number | undefined => {
	// Do not bias by read/unread state; use default sorter (recency)
	return undefined;
},
```

Equivalent cleanup (preferred stylistically): remove `overrideCompare` entirely from this call site if no other override behavior is needed.

### Option B: Comprehensive Fix (Optional)
If product wants to preserve unread discoverability without affecting order:
- Keep recency sort unchanged.
- Surface unread via badge/counter/filter affordances only (already present in agent status/sessions filtering).

Trade-off: slightly less aggressive promotion of unread sessions, but predictable ordering and less churn.

## Confidence Level: High

## Reasoning
The issue symptom exactly matches the explicit unread-first comparator in stacked mode. The default sorter already sorts by recency after status/archived handling, which aligns with the requested behavior and maintainer guidance (“always sort by recency”, archived still at end). Removing this comparator is a minimal one-file fix that directly targets the problematic behavior without changing broader session model semantics.
