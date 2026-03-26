# Bug Analysis: Issue #281642

## Understanding the Bug

In the **Agent Sessions** view, while a **background** agent session is running, the second line (progress / description) should show live activity (tool call titles, progress messages, etc.). Users instead sometimes see the **worktree / session title** in that slot—between tool calls or when the model is idle (“working…” with no new progress chunk). The report suggests that when there is no live progress text, the UI falls back to a **static session description** that matches the session label (often the worktree name).

## Git History Analysis

Within 7 days before `parentCommit` (`16bb4a308a90e36f8597a0e344b9fa5a99247213`), agent-session–related history is sparse; the relevant logic lives in long-standing chat session plumbing. The regression is understandable from code review rather than a single nearby commit.

### Time Window Used

- Initial: 24 hours  
- Final: 7 days (no single smoking-gun commit; behavior follows from `mainThreadChatSessions` merge logic)

## Root Cause

For contributed sessions (e.g. background / `copilotcli`), `mainThreadChatSessions._provideChatSessionItems` builds each list item like this (conceptually):

1. If a live `IChatModel` exists, set `description = chatSessionsService.getSessionDescription(model)` (derived from the **last in-flight response parts**: tools, progress messages, thinking, etc.).
2. Then set the item’s `description` to **`description || session.description`**, where `session.description` comes from the extension’s static `IChatSessionItem`.

When the agent is **in progress** but `getSessionDescription` returns **nothing** (gap between tool invocations, no matching response part yet, or empty plaintext after rendering), the `||` falls through to **`session.description`**, which is typically the same kind of text as the session title (worktree / session summary). That matches the reported “shows worktree name” flash.

Local-only sessions (`localAgentSessionsProvider`) do **not** apply this fallback—they only use `getSessionDescription(model)`—so the bug is specific to the **extension-backed** session item path.

## Proposed Fix

### Option A: Targeted Fix (Recommended)

**Affected files:**

- `src/vs/workbench/api/browser/mainThreadChatSessions.ts` — `_provideChatSessionItems`  
- Optionally `src/vs/workbench/contrib/chat/browser/chatSessions.contribution.ts` / `chatSessionsService.ts` if you prefer a single helper for “merged” description (the real PR may centralize this; keep behavior identical).

**Changes required:**

1. **Stop falling back to `session.description` while the session is in progress** when a live model exists and `getSessionDescription` yields no string. In that case pass **`undefined`** (or omit) so `agentSessionsViewer.renderDescription` uses the **“Working…”** path for `ChatSessionStatus.InProgress`.

2. **Resolve “in progress” reliably:** Prefer `session.status === ChatSessionStatus.InProgress` when the ext host sends it. If `status` is missing, derive from the model the same way as `LocalAgentsSessionsProvider.modelToStatus` (`requestInProgress`, last request/response completion, etc.) so gaps are still detected when the extension omits status.

3. **Merge rule (concrete):**

   - If `getSessionDescription(model)` returns a non-empty string → use it.  
   - Else if in progress → **`description: undefined`** (do **not** use `session.description`).  
   - Else → `description: session.description` (keep static description for completed / idle list entries without a model).

4. **Empty string:** Treat `''` from `getSessionDescription` like “no live description” for the in-progress branch (same as `undefined`), so `'' || session.description` cannot resurrect the worktree string.

**Code sketch (illustrative):**

```typescript
// inside _provideChatSessionItems map, after computing `description` from getSessionDescription
const inProgress =
	session.status === ChatSessionStatus.InProgress ||
	(model ? isModelInProgress(model) : false);

const mergedDescription =
	description && description.trim() !== ''
		? description
		: inProgress
			? undefined
			: session.description;

return {
	...session,
	changes,
	resource: uri,
	iconPath: session.iconPath,
	tooltip: ...,
	description: mergedDescription,
} satisfies IChatSessionItem;
```

(`isModelInProgress` should mirror `LocalAgentsSessionsProvider.modelToStatus` → `InProgress`; import `ChatSessionStatus` from `chatSessionsService.js`.)

**Tests / mocks:** Update `mockChatSessionsService` or any provider tests if the service API gains a helper; align `localAgentSessionsProvider` only if you introduce shared merge logic (must not regress local sessions).

### Option B: Comprehensive Fix (Optional)

Add `IChatSessionsService.mergeSessionItemDescription(model, sessionItem): string | undefined` and use it from both `mainThreadChatSessions` and, if desired, local providers so all session types share one policy. Higher churn; only worth it if more call sites need the same rules.

## Confidence Level: High

## Reasoning

- The fallback `description || session.description` exactly explains “no live progress → show static session description,” which for background sessions aligns with worktree/title text.  
- `getSessionDescription` intentionally returns nothing when there is no suitable response part; that is **not** the same as “show the extension’s static description” during an active run.  
- Clearing the description for in-progress gaps lets the existing viewer logic show **“Working…”**, matching the expected UX in the issue.
