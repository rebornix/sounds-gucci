# Bug Analysis: Issue #282175

## Understanding the Bug

`handleSessionModelOverrides` in `mainThreadChatSessions.ts` gates description overrides on `this._chatSessionsService.getInProgress().length` — a **global** “any session type has in-progress items” signal from the sessions UI layer. When that is non-zero, the code assigns `session.description = getInProgressSessionDescription(model)` for **every** session item being mapped, including sessions whose chat model is already complete.

For completed chats, `getInProgressSessionDescription` returns `undefined` (it explicitly bails when `response.isComplete`). That **overwrites** the extension-provided `session.description` with `undefined`, dropping stable titles/descriptions for finished sessions whenever **some other** session is still running.

Maintainer comment (@osortega): overrides must apply to sessions that are **actually in progress**, and for those it is correct to take the value from the model **even when that value is `undefined`** (prioritize live model state). The flawed Copilot-only tweak (`if (desc !== undefined)`) would violate that second requirement.

## Git History Analysis

At `parentCommit` the only commit in a 7-day window ending at the parent timestamp is the parent itself (`ab41693fdd7`), so there is little extra regression signal from `git log`; the defect is localized to the override helper.

### Time Window Used

- Initial: 24 hours (expanded)
- Final: 7 days — single relevant commit (parent)

## Root Cause

**Wrong predicate:** `if (inProgress.length)` conflates “something somewhere is in progress” with “**this** `IChatModel` is in progress.” The per-session description helper already encodes completion vs in-flight via the last request’s `response.isComplete`; the wrapper should use a **per-model** in-progress check, not the global `getInProgress()` aggregate.

## Proposed Fix

### Option A: Targeted Fix (Recommended)

**Affected Files:**

- `src/vs/workbench/api/browser/mainThreadChatSessions.ts`

**Changes Required:**

In `handleSessionModelOverrides`, remove reliance on `getInProgress().length`. Instead, determine whether **this** `model` has an active (incomplete) last response — mirroring the early logic inside `getInProgressSessionDescription`. Only when that holds, assign:

`session.description = this._chatSessionsService.getInProgressSessionDescription(model);`

including when the RHS is `undefined`, so in-progress sessions still prefer model state over stale provider text.

**Code Sketch:**

```typescript
private async handleSessionModelOverrides(model: IChatModel, session: Dto<IChatSessionItem>): Promise<Dto<IChatSessionItem>> {
	const requests = model.getRequests();
	const lastResponse = requests.at(-1)?.response;
	const thisSessionInProgress = Boolean(lastResponse && !lastResponse.isComplete);
	if (thisSessionInProgress) {
		session.description = this._chatSessionsService.getInProgressSessionDescription(model);
	}

	// Override changes (unchanged)
	// ...
	return session;
}
```

(Optional: delete the unused `inProgress` local entirely.)

### Option B: Comprehensive Fix (Optional)

Add `isChatSessionInProgress(model: IChatModel): boolean` (or similar) on `IChatSessionsService` / `ChatSessionsService` and implement it once next to `getInProgressSessionDescription`, so the “in progress?” predicate stays in one place if more call sites need it. Slightly more API surface; better DRY if repeated.

## Confidence Level: High

## Reasoning

- The symptom matches the control flow: global gate + per-session helper returning `undefined` for complete chats guarantees clobbering provider descriptions for non-active sessions.
- Replacing the gate with a **per-model** incomplete-response check fixes only the buggy path: completed sessions keep `session.description` from the provider; in-progress sessions still get live overrides, including explicit `undefined` when the model has no progress text yet — consistent with the maintainer note.
