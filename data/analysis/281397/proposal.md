# Bug Analysis: Issue #281149

## Understanding the Bug

**Issue Title:** Local Session shows no empty description/progress when the chat widget is streaming in text

**Symptoms:**
1. After a few successful tool calls, when the agent starts streaming text or showing "working", the Agent Sessions View shows a **blank** progress/description instead of meaningful status
2. After the session is fully finished, it doesn't show "Finished" either - just blank

## Git History Analysis

Analyzed git history for `src/vs/workbench/contrib/chat/browser/agentSessions/` files around December 3-5, 2025.

Relevant commits found:
- `3015de171b1` - agent sessions - allow to show all sessions (#281271)
- `cc2bc7a05b9` - agent sessions - context keys (#281186)  
- `1ea1a271e86` - Fix for markdown chat titles (#281123)
- `ca081ff5f80` - Store chat session stats in metadata (#281088)
- `d784d6da773` - delete fallback for `getSessionDescription` (#280683)

The bug appears to be related to timing property mismatches introduced during rapid development of the agent sessions feature.

### Time Window Used
- Initial: 24 hours
- Final: 48 hours (expanded 1 time)

## Root Cause

The bug is caused by **timing property name mismatches** between three different parts of the codebase:

### 1. Interface Definition ([chatSessionsService.ts](src/vs/workbench/contrib/chat/common/chatSessionsService.ts#L60-L63))
```typescript
timing: {
  startTime: number;
  endTime?: number;
};
```

### 2. Provider Returns ([localAgentSessionsProvider.ts](src/vs/workbench/contrib/chat/browser/agentSessions/localAgentSessionsProvider.ts#L86-L89))
```typescript
timing: {
  startTime,
  endTime
}
```

### 3. Model Expects ([agentSessionsModel.ts](src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsModel.ts) in `doResolve`)
```typescript
let { created, lastRequestStarted, lastRequestEnded } = session.timing;
// ALL UNDEFINED! Because session.timing has startTime/endTime, not these properties
```

### 4. Viewer Checks ([agentSessionsViewer.ts](src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsViewer.ts#L202-L206))
```typescript
session.element.timing.finishedOrFailedTime &&
session.element.timing.inProgressTime
// BOTH UNDEFINED! The model doesn't have these properties
```

**Result:** The timing information is lost due to property name mismatches. When the viewer tries to render:
- It checks for `finishedOrFailedTime` and `inProgressTime` which don't exist
- The fallback logic that shows "Working..." or "Finished" should work, but something prevents it from displaying

Additionally, in `getSessionDescription` in [chatSessions.contribution.ts](src/vs/workbench/contrib/chat/browser/chatSessions.contribution.ts):
- Returns `undefined` when response is complete (correct - triggers "Finished" fallback)
- Returns `renderAsPlaintext('')` (empty string) when streaming text with no tool invocations (should trigger "Working..." fallback)

The viewer's logic in `renderDescription` handles empty strings correctly, but the timing mismatch prevents proper duration calculation in the fallback.

## Proposed Fix

### Affected Files
- `src/vs/workbench/contrib/chat/browser/agentSessions/localAgentSessionsProvider.ts`
- `src/vs/workbench/contrib/chat/browser/chatSessions.contribution.ts`
- (Possibly) `src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsViewer.ts`

### Changes Required

**Option A: Align Provider Output to Model Expectations**

Update `localAgentSessionsProvider.ts` to return timing with the property names the model expects:

```typescript
// In toChatSessionItem method
return {
  // ...
  timing: {
    startTime,  // Keep for interface compatibility
    endTime,    // Keep for interface compatibility
    // Add the properties the model/viewer expect:
    inProgressTime: startTime,
    finishedOrFailedTime: endTime,
    created: startTime,
    lastRequestStarted: startTime,
    lastRequestEnded: endTime,
  },
  // ...
};
```

**Option B: Fix the Model/Viewer to Use Correct Property Names**

Update `agentSessionsViewer.ts` to use the correct timing properties:

```typescript
// In renderDescription, change:
else if (
  session.element.timing.finishedOrFailedTime &&
  session.element.timing.inProgressTime
// To:
else if (
  session.element.timing.endTime &&
  session.element.timing.startTime
)

// And update toDuration call:
const duration = this.toDuration(
  session.element.timing.startTime,
  session.element.timing.endTime
);
```

**Also update `chatSessions.contribution.ts`** to ensure proper description fallback:
- When streaming text (no tool invocations), ensure `getSessionDescription` returns `undefined` instead of empty string to trigger the "Working..." fallback

### Code Sketch

```typescript
// agentSessionsViewer.ts - renderDescription method
private renderDescription(session: ITreeNode<IAgentSession, FuzzyScore>, template: IAgentSessionItemTemplate): void {
  const description = session.element.description;
  if (description) {
    // existing rendering code
  }
  // Fallback to state label
  else {
    if (session.element.status === ChatSessionStatus.InProgress) {
      template.description.textContent = localize('chat.session.status.inProgress', "Working...");
    } else if (
      session.element.timing.endTime &&
      session.element.timing.startTime &&
      session.element.timing.endTime > session.element.timing.startTime
    ) {
      const duration = this.toDuration(session.element.timing.startTime, session.element.timing.endTime);
      // ... rest of duration logic
    } else {
      // ... "Finished" or "Failed" fallback
    }
  }
}
```

## Confidence Level: High

## Reasoning

1. **Clear property mismatch:** The code explicitly destructures properties (`created`, `lastRequestStarted`, `lastRequestEnded`, `finishedOrFailedTime`, `inProgressTime`) that don't exist in the interface definition (`startTime`, `endTime`).

2. **Recent rapid development:** The agent sessions feature was being actively developed (many commits in Dec 3-5), and timing property names appear to have been inconsistently used during this period.

3. **Symptoms match:** The bug description mentions:
   - "shows a blank progress / description" → timing mismatch causes the duration calculation to fail silently
   - "doesn't show 'Finished' either" → the fallback to "Finished" without duration should still work, suggesting the viewer's description might be set elsewhere or there's an additional rendering issue

4. **The fix is straightforward:** Aligning property names across the provider, model, and viewer should resolve the issue.
