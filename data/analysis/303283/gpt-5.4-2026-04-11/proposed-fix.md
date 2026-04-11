# Bug Analysis: Issue #303283

## Understanding the Bug

Chat tips are supposed to stop surfacing once the user acts on one of them, but that suppression does not survive moving into another chat conversation in the same VS Code run.

The maintainer repro is especially useful here:

- Start a transient insiders session
- Let the Plan agent tip appear
- Click the Plan agent action on the tip
- Another tip appears immediately afterward

That means the bug is not just "this one tip was not dismissed". The broader "stop showing tips for the current session after the user takes action" behavior is being lost as soon as the tip action changes the active chat session/model.

## Git History Analysis

### Time Window Used

- Initial: 24 hours
- Expanded to: 3 days
- Final: 7 days

### Findings

- The 24-hour and 3-day windows before parent commit `6afe980a82f8b85e63aba9c4ca428044b02e2e3d` did not contain relevant chat-tip changes.
- The 7-day window contained nearby work in sessions and chat-tip rollout, but not a direct fix/regression in the tip logic itself. The two most relevant commits in that window were:
  - `d466d7d67b1` `sessions: Extensible sessions provider architecture and ISessionData migration (#304626)`
  - `fad70f3f774` `set chat tips to true, always elevate AI profiles (#304553)`
- The real signal came from blaming the current implementation lines:
  - `a5f53a88d0ee` `add tip for welcome view, first request per session, improve styling (#294653)` added the getting-started tip flow and the call to `chatTipService.resetSession()` from `ChatWidget.setModel()`.
  - `7373db526df7` `hide tip widget for session if a tip is dismissed or actioned (#298766)` added `_tipsHiddenForSession` plus `hideTipsForSession()` after a tip command is executed.

Those two behaviors conflict in exactly the way described by the issue.

## Root Cause

`ChatTipService` already has session-wide suppression via `_tipsHiddenForSession`, and `_trackTipCommandClicks()` correctly calls `hideTipsForSession()` when the user acts on a tip.

The problem is that `ChatWidget.setModel()` unconditionally calls `chatTipService.resetSession()` whenever the widget binds to a different chat model/session, and `resetSession()` clears `_tipsHiddenForSession` back to `false`.

Actions like `workbench.action.chat.openPlan` naturally change the active chat session/model, so the service hides tips and then immediately forgets that it hid them. Once `getWelcomeTip()` runs again, it picks the next eligible foundational tip, which matches the observed behavior where `/create-agent` or another tip appears right after acting on the Plan tip.

## Proposed Fix

### Option A: Targeted Fix (Recommended)

**Affected Files:**
- `src/vs/workbench/contrib/chat/browser/chatTipService.ts`
- `src/vs/workbench/contrib/chat/test/browser/chatTipService.test.ts`

**Changes Required:**

- Stop resetting `_tipsHiddenForSession` inside `ChatTipService.resetSession()`.
- Keep `resetSession()` responsible only for per-conversation state such as `_shownTip`, `_tipRequestId`, and `_contextKeyService`.
- Update the `resetSession()` doc comment to clarify that it resets conversation-bound tip state but preserves session-wide suppression after a tip has been actioned or dismissed.
- Update/add regression tests so that after a tip action or `dismissTipForSession()`, calling `resetSession()` does not cause a new tip to appear.

**Code Sketch:**

```ts
resetSession(): void {
	this._shownTip = undefined;
	this._tipRequestId = undefined;
	this._contextKeyService = undefined;
	// Preserve _tipsHiddenForSession so that acting on one tip suppresses
	// follow-up tips across chat/session switches in the current app session.
}
```

**Why this is the minimal fix:**

The session-hide behavior already exists and already fires in the correct user-action path. The regression comes from resetting that flag too aggressively when the chat widget switches conversations.

### Option B: Explicit State Split

**Affected Files:**
- `src/vs/workbench/contrib/chat/browser/chatTipService.ts`
- `src/vs/workbench/contrib/chat/browser/widget/chatWidget.ts`
- `src/vs/workbench/contrib/chat/test/browser/chatTipService.test.ts`

**Changes Required:**

- Split the current `resetSession()` behavior into two concepts:
  - a conversation reset that clears `_shownTip`, `_tipRequestId`, and `_contextKeyService`
  - a full suppression reset that also clears `_tipsHiddenForSession`
- Call only the conversation-reset method from `ChatWidget.setModel()`.
- Reserve the full reset for explicit user-initiated recovery flows or test setup.

**Trade-offs:**

This is more explicit and less ambiguous, but it is more code than necessary if the product intention is simply "once a tip is actioned, do not show more tips again in this app session."

## Confidence Level: Medium/High

## Reasoning

The maintainer repro maps cleanly onto the current code path:

1. A tip action executes.
2. `ChatTipService._trackTipCommandClicks()` calls `hideTipsForSession()`.
3. The action changes the active chat session/model.
4. `ChatWidget.setModel()` calls `resetSession()`.
5. `resetSession()` clears `_tipsHiddenForSession`.
6. `getWelcomeTip()` runs again and surfaces the next eligible tip.

The existing tests only verify that the original tip stays dismissed after `resetSession()`. They do not verify that *all* tips remain hidden after a conversation switch, which is why this regression was able to survive.

If the original `/create-prompt` report was triggered by manually typing the slash command rather than clicking the tip action, there may also be a follow-up improvement worth considering in `recordSlashCommandUsage()` / `_hideShownTipIfNowIneligible()`. But the maintainer repro is already fully explained by the `hideTipsForSession()` + `resetSession()` interaction above, so that is the minimal root-cause fix.