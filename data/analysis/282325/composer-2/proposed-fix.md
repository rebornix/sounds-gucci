# Proposed fix — Issue #281630 (PR analysis folder 282325)

## Summary

When `chat.checkpoints.showFileChanges` is enabled, the chat list renderer adds a checkpoint-style **file changes summary** part to completed assistant responses. **Background (non-local) agent sessions** already expose their own file-changes UI, so the setting causes a **duplicate** “file changes” block in those sessions.

## Root cause

`ChatListRenderer` appends a synthesized `changesSummary` part via `getChatFileChangesSummaryPart`, which is used from both progressive rendering (`getNextProgressiveRenderContent`) and basic response rendering (`renderChatResponseBasic`). That summary is meant for **local** checkpoint UX; it should not run for **non-local** session resources where the session provider already owns file-change presentation.

## Intended behavior (from issue / product direction)

Respect `chat.checkpoints.showFileChanges` **only for local sessions**. For non-local (background) sessions, **do not** inject this summary, even when the user has the setting turned on.

## Proposed code change

**File:** `src/vs/workbench/contrib/chat/browser/chatListRenderer.ts`

1. Ensure imports include session typing helpers (already present at this revision: `localChatSessionType` from `../common/chatSessionsService.js`, `getChatSessionType` from `../common/chatUri.js`).

2. In `shouldShowFileChangesSummary`, require a **local** session in addition to completion and the config flag:

```typescript
private shouldShowFileChangesSummary(element: IChatResponseViewModel): boolean {
	const isLocalSession = getChatSessionType(element.sessionResource) === localChatSessionType;
	return element.isComplete && isLocalSession && this.configService.getValue<boolean>('chat.checkpoints.showFileChanges');
}
```

`getChatFileChangesSummaryPart` already early-returns when `shouldShowFileChangesSummary` is false, so both render paths stay consistent.

## Notes from investigation at `parentCommit` (`643aa3a33b39d5e36d7e8ed4e0dc016979b82c74`)

- The `isLocalSession` guard and comment (“Only show file changes summary for local sessions - background sessions already have their own file changes part”) are **already present** in `shouldShowFileChangesSummary` at this commit.
- If insiders still reproduced duplication after this landed, the next place to check is whether `element.sessionResource` is sometimes classified as **local** for a background session (e.g. `getChatSessionType` treating certain URIs as local). Fixing that classification would be upstream of the renderer guard.

## Risk / testing

- Toggle `chat.checkpoints.showFileChanges` on a **local** chat: summary should still appear when the response completes and edits exist.
- Same toggle on a **background / non-local** session: only the session-native file changes UI should appear—no second checkpoint summary block.
