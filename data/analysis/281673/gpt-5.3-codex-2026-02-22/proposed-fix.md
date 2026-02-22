# Bug Analysis: Issue #281642

## Understanding the Bug
In the Agent Sessions view, an in-progress background session intermittently shows the worktree name in the description row instead of continuing to show progress/invocation text (for example around the "Working..." phase).

Expected behavior from the issue:
- During in-progress execution, description should keep showing progress/invocation state text.

Actual behavior:
- Description can switch to worktree name mid-run, then return to tool-call text later.

## Git History Analysis
Relevant history found in the chat/agent sessions area:
- `431aebe28b6` — "Fix for agent session progress (#281397)"
- `1eea41f3b8d` — "Apply and file changes part for worktree (#281410)"
- `17876678e9d` — "Various fixes for session progress"

Most relevant change:
- `17876678e9d` changed `getSessionDescription` to prioritize `toolInvocation.generatedTitle` before invocation/progress text:
  - from: `pastTenseMessage || invocationMessage`
  - to: `generatedTitle || pastTenseMessage || invocationMessage`

`generatedTitle` is commonly a worktree-oriented label. In an in-progress session with sparse progress messages, this can override user-facing progress text and cause the exact symptom described.

### Time Window Used
- Initial: 24 hours
- Final: 168 hours (expanded 2 times: 24h → 72h → 168h)

## Root Cause
`ChatSessionsService.getSessionDescription` in `chatSessions.contribution.ts` uses `toolInvocation.generatedTitle` as top priority for in-progress tool invocation description. For agent/worktree tools, `generatedTitle` can be the worktree name, so the Agent Sessions UI displays that instead of transient progress text like "Working...".

## Proposed Fix

### Option A: Targeted Fix (Recommended)
**Affected Files:**
- `src/vs/workbench/contrib/chat/browser/chatSessions.contribution.ts`

**Changes Required:**
- In `getSessionDescription`, for `part.kind === 'toolInvocation'`, stop prioritizing `generatedTitle` for in-progress description text.
- Prefer invocation/progress-oriented strings:
  - `pastTenseMessage || invocationMessage`
- Keep existing waiting-for-confirmation override logic unchanged.

**Code Sketch:**
```ts
// inside getSessionDescription(...), toolInvocation branch
const toolInvocation = part as IChatToolInvocation;
const state = toolInvocation.state.get();

// Do not use generatedTitle here; it may be a worktree name.
description = toolInvocation.pastTenseMessage || toolInvocation.invocationMessage;

if (state.type === IChatToolInvocation.StateKind.WaitingForConfirmation) {
  const confirmationTitle = toolInvocation.confirmationMessages?.title;
  const titleMessage = confirmationTitle && (typeof confirmationTitle === 'string'
    ? confirmationTitle
    : confirmationTitle.value);
  const descriptionValue = typeof description === 'string' ? description : description.value;
  description = titleMessage ?? localize(
    'chat.sessions.description.waitingForConfirmation',
    'Waiting for confirmation: {0}',
    descriptionValue
  );
}
```

### Option B: Comprehensive Fix (Optional)
Introduce state-aware title selection:
- In progress: prioritize `progressMessage`, then `invocationMessage`.
- Completed/failed summaries: allow `generatedTitle` when explicitly intended as a final summary label.

Trade-off:
- More robust semantics, but broader behavior changes and more validation required.

## Confidence Level: High

## Reasoning
- The issue symptom (worktree name replacing "Working..." mid-progress) directly matches the behavior introduced by prioritizing `generatedTitle`.
- `getSessionDescription` feeds `LocalAgentsSessionsProvider` description, which is what `agentSessionsViewer` renders when present.
- Removing `generatedTitle` from the in-progress description path is a minimal, targeted fix with low blast radius and directly addresses the incorrect fallback display.