# Bug Analysis: Issue #289963

## Understanding the Bug

- **Expected:** After starting a chat message on the Agent Sessions welcome page in an empty window and opening a folder/workspace (via the workspace picker + submit), the drafted message and mode should appear in the destination window.
- **Actual:** When the folder/workspace restores with editors already open, the message is not carried over. In a new empty window, the welcome chat still shows the prepopulated text.
- **Hypothesis from the report:** The failure correlates with the target workspace having restored files/editors, not with the storage mechanism being empty.

## Git History Analysis

- **Time window:** Parent commit `37b8e6d5e05653f776a4168c5261992a3cf580f8` (`2026-01-23T22:21:10Z`). `git log` in the 24h / 7d window before that SHA only contained the parent itself; no additional local commits in that slice for deeper regression hunting.

### Time Window Used

- Initial: 24 hours  
- Final: 7 days (no additional commits found before parent in this clone)

## Root Cause

1. **Prefill write path (correct):** `AgentSessionsWelcomePage.handleWorkspaceSubmission` stores JSON `{ query, mode }` under `chat.welcomeViewPrefill` in `StorageScope.APPLICATION`, then opens the target folder/workspace via `IHostService.openWindow`.

2. **Prefill read path (too narrow):** `applyPrefillData()` only runs inside `AgentSessionsWelcomePage.buildChatWidget()` when the Agent Sessions Welcome **editor** is constructed.

3. **Startup gate:** `AgentSessionsWelcomeRunnerContribution` (`agentSessionsWelcome.contribution.ts`) only opens the welcome editor when, after restore, there is **no** `editorService.activeEditor`. If the workspace restores editors (files open), the runner returns early and the welcome page never loads—so `applyPrefillData()` never runs. The auxiliary-bar maximized early-return path has the same effect.

4. **Why empty new window “works”:** With no restored editors, `activeEditor` can be unset, the welcome page opens, and the prefill is applied there.

The chat surface users expect after opening a folder is often the **Chat view** (`ChatViewPane`), not the welcome editor. Even when prefill were applied only on the welcome page, it would be easy to miss; when the welcome page is skipped entirely, the bug is guaranteed.

## Proposed Fix

### Option A: Targeted Fix (Recommended)

**Affected files:**

- `src/vs/workbench/contrib/chat/browser/widgetHosts/viewPane/chatViewPane.ts` (primary)
- Optionally `src/vs/workbench/contrib/welcomeAgentSessions/browser/agentSessionsWelcome.ts` (dedupe / shared helper)

**Changes required:**

1. **Consume `chat.welcomeViewPrefill` from `ChatViewPane`** once the chat widget has a model and is ready to accept input—e.g. after `showModel` completes and `_widget.setModel(model)` has run (similar timing to when the user can type in the panel). Use the same key, scope, and JSON shape as `applyPrefillData()`:
   - Read `storageService.get('chat.welcomeViewPrefill', StorageScope.APPLICATION)`
   - If present, `remove` immediately (same as welcome page), parse JSON, call `setInput(query)` and `input.setChatMode(mode, false)` on the pane’s `ChatWidget`, then focus input.
   - Respect the same guard as the welcome page if needed (e.g. only when `defaultChatAgent` / extension activation semantics matter—mirror `buildChatWidget` if those checks are required for a correct UX).

2. **Avoid double application / race:** Either:
   - Remove `applyPrefillData()` from the welcome page and centralize in one place (e.g. small helper used only from `ChatViewPane`), **or**
   - Keep both but rely on remove-on-read so only the first consumer wins—and ensure `ChatViewPane` does not run so early that it steals prefill before an intentional welcome-first flow (if that flow still exists). Safer: **single consumer** in `ChatViewPane` plus optional welcome calling the same helper only when the pane is not yet created (usually simpler to prefer **ChatViewPane-only** consumption).

3. **Optional UX alignment:** In `agentSessionsWelcome.contribution.ts`, if product intent is to still open the welcome tab when prefill is pending, you could relax the `activeEditor` check when `chat.welcomeViewPrefill` is set; this is secondary if `ChatViewPane` reliably applies prefill.

**Code sketch (conceptual):**

```typescript
// chatViewPane.ts — after model is on the widget (e.g. end of showModel)
private applyWelcomePrefillFromStorage(): void {
  const raw = this.storageService.get('chat.welcomeViewPrefill', StorageScope.APPLICATION);
  if (!raw) return;
  this.storageService.remove('chat.welcomeViewPrefill', StorageScope.APPLICATION);
  try {
    const { query, mode } = JSON.parse(raw);
    if (query) this._widget.setInput(query);
    if (mode !== undefined) this._widget.input.setChatMode(mode, false);
    this._widget.focusInput();
  } catch { /* ignore */ }
}
```

### Option B: Comprehensive Fix (Optional)

- Introduce a small `IChatWelcomePrefillService` (or static helper) that owns the storage key and applies to a `ChatWidget`, invoked from `ChatViewPane` and, if desired, from `AgentSessionsWelcomePage` for the embedded widget—with explicit policy for which surface wins.

## Confidence Level: High

## Reasoning

The runner contribution explicitly skips opening the welcome editor when restored editors yield an `activeEditor`, which matches the user’s “folder has files open” condition. Prefill is only applied in the welcome page’s widget today, so that path never runs. Applying the same stored payload when the main chat view initializes closes the gap without changing how the message is stored before `openWindow`.
