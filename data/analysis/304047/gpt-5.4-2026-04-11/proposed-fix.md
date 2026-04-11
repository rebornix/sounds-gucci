# Bug Analysis: Issue #304047

## Understanding the Bug

The issue reports that after using the Artifacts tool to set screenshots as session artifacts, pressing the "+" action to create a new chat leaves the old artifact list visible. The expected behavior is that a new chat starts with no artifacts shown. There are no follow-up comments on the issue.

## Git History Analysis

- The initial 24-hour window before parent commit `13d5f73773a8b66626e1d89149a73018a02664d7` did not surface relevant artifact-related changes.
- Expanding to 3 days still did not show the artifact feature work in the relevant files.
- Expanding to 7 days surfaced the two relevant commits:
  - `342fd3c2ba7` (`2026-03-18`) `implements artifact view`
  - `193de6c4e4b` (`2026-03-20`) `Fixes artifact view styling issues.`
- The `342fd3c2ba7` change added artifact rendering hooks in `chatWidget.ts`, including `this.input.renderArtifactsWidget(this.viewModel.sessionResource)` and an `onDidUpdateArtifacts` listener.
- `git blame` on `chatWidget.clear()` shows that this method still only clears the todo list widget via `clearTodoListWidget(...)`; it never clears the artifacts widget, even though `ChatInputPart` already exposes `clearArtifactsWidget()`.

### Time Window Used

- Initial: 24 hours
- Final: 168 hours (expanded twice)

## Root Cause

The artifact view was integrated as another session-scoped widget, but the chat reset paths were not updated to clear it. When the user starts a new chat, the existing `ChatArtifactsWidget` instance is left visible, so it continues to display artifacts from the previous session until something explicitly re-renders or hides it.

## Proposed Fix

### Option A: Targeted Fix (Recommended)

**Affected Files:**
- `src/vs/workbench/contrib/chat/browser/widget/chatWidget.ts`

**Changes Required:**

Add artifact-widget cleanup in the same reset paths that already clear the todo widget:

1. In `ChatWidget.clear()`, call `this.inputPart.clearArtifactsWidget()` immediately after `clearTodoListWidget(...)`.
2. In `setModel(model)`, hide the artifacts widget when `model` is `undefined`, and clear it before switching to a different session model so stale artifacts cannot remain visible during the transition.
3. Keep the existing `this.input.renderArtifactsWidget(this.viewModel.sessionResource)` call at the end of `setModel(...)` so the new session renders its own artifacts, if any.

This fixes the UI leak without deleting artifact data from the old session.

**Code Sketch:**

```ts
async clear(): Promise<void> {
        ...
        this.inputPart.clearTodoListWidget(this.viewModel?.sessionResource, true);
        this.inputPart.clearArtifactsWidget();
        this.chatSuggestNextWidget.hide();
        await this.viewOptions.clear?.();
}

setModel(model: IChatModel | undefined): void {
        ...
        if (!model) {
                this.inputPart.clearArtifactsWidget();
                this.viewModel = undefined;
                ...
                return;
        }

        this.inputPart.clearTodoListWidget(model.sessionResource, false);
        this.inputPart.clearArtifactsWidget();
        ...
        this.input.renderArtifactsWidget(this.viewModel.sessionResource);
}
```

### Option B: Comprehensive Fix (Optional)

Factor the todo-list and artifacts cleanup into a single helper for session-scoped widgets, and call that helper from `clear()`, `setModel(undefined)`, and session-switch paths. That would reduce the risk of future session-scoped UI regressions, but it is broader than necessary for this issue.

## Confidence Level: High

## Reasoning

The report is specifically about stale UI after starting a new chat, and the code already contains a dedicated `clearArtifactsWidget()` helper that is never used in the relevant reset path. The artifact feature was added only a few days before the parent commit, and the history shows render wiring was added without corresponding clear wiring. That makes a missing widget reset in `chatWidget.ts` the most direct explanation for the bug, and reusing the existing clear helper is the smallest fix that preserves artifact history for older sessions.