# Proposed fix: Unread state seems flaky and random (#290346)

## Root cause

In `AgentSessionsModel`, “read” is not a simple persisted flag. `isRead()` is computed by comparing the stored read timestamp to the session’s latest activity time:

```typescript
(readDate ?? READ_STATE_INITIAL_DATE) >= (lastRequestEnded ?? lastRequestStarted ?? created)
```

When the user marks a session read, `setRead(true)` stores `read: Date.now()`. If that value is **ever less than** the activity timestamp the provider supplies (ordering/async: user clears the dot while the model still reports a slightly later `lastRequestEnded`; merge from cache + fresh resolve changing timings; or faked `Date.now()` vs fixed session times in tests), the inequality fails and the session is treated as **unread** again. That matches “I marked everything read, reopened VS Code, blue dots came back” and the existing test comment that after unarchiving a session “may appear unread again based on the time comparison.”

So the logic is **fragile**: a small mismatch between “when we recorded read” and “what counts as last activity” flips the UI unpredictably.

## Recommended code change

**File:** `src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsModel.ts`

**Change:** When persisting a read state (`setRead(session, true)`), set `read` to a timestamp that is **never below** the current session activity used in `isRead()`:

- Let `activity = session.timing.lastRequestEnded ?? session.timing.lastRequestStarted ?? session.timing.created ?? 0`.
- Store `read: Math.max(Date.now(), activity)` instead of only `Date.now()`.

For `setRead(false)`, keep `read: 0`.

This keeps the same comparison for default/unread behavior and for `READ_STATE_INITIAL_DATE`, but once the user explicitly marks read (or any path that calls `setRead(true)`), the stored value always dominates the activity line so reopen/resolve does not spuriously mark the session unread unless there is **new** activity after that (which is reasonable product behavior).

**Optional hardening (same file):** If `setRead` early-outs with `if (read === this.isRead(session))`, consider whether callers that only bump timestamps need a force path; usually the `Math.max` fix is enough because the first mark-read after a mismatch will correct the stored value.

## Tests

**File:** `src/vs/workbench/contrib/chat/test/browser/agentSessions/agentSessionViewModel.test.ts`

- Adjust the **“should mark session as read when archiving”** / unarchive expectations: after unarchiving, if read was persisted with `Math.max(Date.now(), activity)`, the session should remain read when the read timestamp was written at archive time (no longer “may appear unread” unless activity advanced).
- Add a focused test: session with `lastRequestEnded` **after** `Date.now()` at mark-read time (simulate with clock or injected times) still ends up `isRead() === true` after `setRead(true)`.

## Product note (from issue discussion)

Maintainer mentioned a **one-time reset** of stored read state so users get a clean baseline after older buggy tracking. That would be a separate, deliberate migration (e.g. bump storage schema or clear `agentSessions.state.cache` once with a version key), not only the timestamp fix above.

## Files touched (expected)

- Primary: `agentSessionsModel.ts` (`setRead`).
- Tests: `agentSessionViewModel.test.ts` (expectations + one new case).
