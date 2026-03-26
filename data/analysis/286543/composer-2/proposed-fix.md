# Bug Analysis: Issue #286498

## Understanding the Bug

- **Expected:** After the user disables AI (e.g. `chat.disableAIFeatures` / hide-AI flows), chat-related commands and UI should respect the disabled state **in the current session**, without requiring a full window restart.
- **Actual (with Copilot Chat installed):** Disabling AI hides or gates behavior correctly **after** restart, but **during the same session** `ChatContextKeys.enabled` (context id `chatIsEnabled`) can remain `true`, so commands and UI that are gated on that key still behave as if chat were active.
- **Maintainer signal (issue comments):** The problem is tied to why a default chat participant still looks “present” for context-key purposes when the Copilot extension is disabled and the extension host restarts—the `_hasDefaultAgent` / `ChatContextKeys.enabled` path does not flip to `false` when it should.

## Git History Analysis

- **Relevant commit in the 24h window before `parentCommit`:** `f0a5b2f90f0` — “AI related quick picker accessible even when AI disabled (fix #286526) (#286540)”, indicating recent work around AI-disabled visibility and context keys in the same timeframe as this report.

### Time Window Used

- Initial: 24 hours before `parentCommit` (`2026-01-08T14:15:18Z`)
- Final: 24 hours (no expansion needed for this hypothesis)

## Root Cause

`ChatContextKeys.enabled` is bound in `ChatAgentService` to `_hasDefaultAgent` and is documented as true when a **default chat participant is activated with an implementation**.

In `registerAgentImplementation`, when an implementation is registered for a default agent, `_hasDefaultAgent` is set to `true`. When that implementation is **disposed** (extension disabled, implementation torn down, etc.), the disposable recomputes the key with:

```typescript
Iterable.some(this._agents.values(), agent => agent.data.isDefault)
```

That predicate ignores whether `agent.impl` is still present. A default agent **data** entry can remain in the map while `impl` is `undefined`, so `some(...)` still returns `true` and `chatIsEnabled` stays `true` until restart clears or reshapes state. That matches “works after restart, wrong in current session” when Copilot’s implementation goes away but registration metadata remains.

## Proposed Fix

### Option A: Targeted Fix (Recommended)

**Affected Files:**

- `src/vs/workbench/contrib/chat/common/participants/chatAgents.ts`

**Changes Required:**

- When recomputing `_hasDefaultAgent` after an implementation is disposed, only count agents that are both default **and** still have an implementation (`impl`), aligning the context key with `getActivatedAgents()` / “activated with an implementation” semantics.

**Code Sketch:**

```typescript
// Inside registerAgentImplementation's toDisposable callback, replace:
this._hasDefaultAgent.set(Iterable.some(this._agents.values(), agent => agent.data.isDefault));

// With:
this._hasDefaultAgent.set(Iterable.some(this._agents.values(), agent => agent.data.isDefault && !!agent.impl));
```

Optional hardening (only if you observe stale `true` when an entire agent row is removed without going through `registerAgentImplementation`’s dispose): centralize a small private method `_refreshHasDefaultAgent()` that applies the same `isDefault && impl` predicate and call it from `registerAgent`’s dispose path as well. The minimal fix above addresses the path explicitly tied to implementation lifecycle.

### Option B: Comprehensive Fix (Optional)

- Refactor so `_hasDefaultAgent` is always derived from a single helper (e.g. “any enabled-by-`when` default agent with `impl`”) and invoke it from every mutation of `_agents` or implementations. Lower risk of future drift but larger diff than needed for this bug.

## Confidence Level: High

## Reasoning

- `chatContextKeys.ts` defines `enabled` as tied to an **activated** default participant with an implementation; the buggy recompute used only `isDefault` on stored data.
- After `entry.impl = undefined`, counting rows with `isDefault` but no `impl` incorrectly preserves `true`, which explains commands still seeing `ChatContextKeys.enabled` until restart.
- Restricting the predicate to `agent.data.isDefault && !!agent.impl` makes the context key false as soon as no default agent has a live implementation, which is the behavior users expect when disabling AI in-session with Copilot installed.
