# Bug Analysis: Issue #289688

## Understanding the Bug

When archiving an agent chat session that still has **pending (undecided) edits** from the editing session / workset, VS Code shows a confirmation dialog, but after confirming, those edits **remain** in the workset instead of being explicitly kept or discarded. Expected behavior (called out in issue discussion) is the same **keep vs. undo** choice used elsewhere when leaving an active edit session—i.e. `showClearEditingSessionConfirmation`, not only “are you sure you want to archive?”.

Repro (from issue): use an agent to make an edit → start a new chat → archive the old chat → user sees archive confirmation but pending changes are not resolved.

## Git History Analysis

Searched the parent-commit tree for `showClearEditingSessionConfirmation`, `shouldShowClearEditingSessionConfirmation`, and archive-related agent session actions. The archive action already imports `shouldShowClearEditingSessionConfirmation` with `{ isArchiveAction: true }` so pending edits are **detected**, but the follow-up UI is a generic `IDialogService.confirm` that only gates archiving and does **not** invoke `accept()` / `reject()` on `model.editingSession`.

### Time Window Used

- Initial: 24 hours  
- Final: 7 days (file-specific `git log` in this clone returned little discrete history for this path; analysis is driven by static tracing of the archive code path vs. `chatEditorInput.ts`).

## Root Cause

In `ArchiveAgentSessionAction.runWithSessions` (`agentSessionsActions.ts`), when `sessionsWithPendingChangesCount > 0`, the code shows `dialogService.confirm` (“pending edits… archive?”). That dialog does **not** run the editing-session resolution flow in `showClearEditingSessionConfirmation` (`chatEditorInput.ts`), which presents **Keep & Continue** / **Undo & Continue** and calls `model.editingSession!.accept()` or `reject()`. Result: session is archived while undecided modifications stay, matching the reported “confirmation shows but changes are still there.”

`shouldShowClearEditingSessionConfirmation` already bypasses `willKeepAlive` for archive via `isArchiveAction` (so the bug is not “detection” but “wrong dialog / no accept-reject”).

## Proposed Fix

### Option A: Targeted Fix (Recommended)

**Affected Files:**

- `src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsActions.ts`

**Changes Required:**

1. Import `showClearEditingSessionConfirmation` from `../widgetHosts/editor/chatEditorInput.js` (alongside existing `shouldShowClearEditingSessionConfirmation`).
2. Replace the block that counts pending sessions and uses `dialogService.confirm` with a **per-session** loop **before** `setArchived(true)`:
   - For each selected session, `const model = chatService.getSession(session.resource)`.
   - If `model && shouldShowClearEditingSessionConfirmation(model, { isArchiveAction: true })`, `await showClearEditingSessionConfirmation(model, dialogService, { titleOverride, messageOverride })` with copy appropriate to **archiving** (not “Start new chat?”).
   - If the prompt returns `false` (cancel), **return** and do not archive any remaining sessions (or define product behavior: cancel all vs. partial—safest is abort entire operation).
3. After all sessions with pending edits have successfully completed the keep/discard prompt, call `session.setArchived(true)` for each as today.

Remove the redundant single `dialogService.confirm` for “pending edits” once the proper prompt is used, so the user gets one clear keep/discard dialog per affected session (or a single combined UX if product prefers—minimal fix is sequential per session).

**Code Sketch:**

```typescript
// In runWithSessions, before archiving:
for (const session of sessions) {
	const chatModel = chatService.getSession(session.resource);
	if (chatModel && shouldShowClearEditingSessionConfirmation(chatModel, { isArchiveAction: true })) {
		const ok = await showClearEditingSessionConfirmation(chatModel, dialogService, {
			titleOverride: nls.localize(..., 'Archive session?'),
			messageOverride: nls.localize(..., 'This session has pending edits. Choose whether to keep or undo them before archiving.'),
		});
		if (!ok) {
			return;
		}
	}
}
for (const session of sessions) {
	session.setArchived(true);
}
```

### Option B: Comprehensive Fix (Optional)

Apply the same **resolve editing session before archive** pattern to:

- `ArchiveAllAgentSessionsAction`
- `ArchiveAgentSessionSectionAction`

Those paths currently archive without running `showClearEditingSessionConfirmation`, so they can leave pending edits orphaned in the same way if used with pending worksets. Same issue scope as Connor’s note about restoring the clear-editing confirmation for archive flows.

## Confidence Level: High

## Reasoning

The symptom matches the control flow: generic `confirm` never touches `IChatModel.editingSession`, while `showClearEditingSessionConfirmation` is the established mechanism that both counts undecided entries and applies `accept()` / `reject()`. Maintainer comment explicitly points at bringing back `showClearEditingSessionConfirmation` for this scenario. Tracing `ArchiveAgentSessionAction` shows detection (`shouldShowClearEditingSessionConfirmation`) without resolution—exact gap.
