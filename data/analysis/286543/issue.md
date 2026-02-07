# Issue #286498: Disabling AI does not apply without restart when Copilot installed

**Repository:** microsoft/vscode
**Author:** @dmitrivMS
**Created:** 2026-01-08T09:26:46Z
**Labels:** bug, verified, confirmed

## Description

Example in the editor:

<img width="339" height="58" alt="Image" src="https://github.com/user-attachments/assets/c32bae55-05ee-41e5-8de8-d08ab8f3ed6f" />

## Comments


### @bpasero (2026-01-08T11:37:19Z)

@dmitrivMS I cannot reproduce this and I would be somewhat surprised if so many commands would not respect the `chat.disableAIFeatures` setting. Are you sure you did apply it correctly?

Most of these commands are gated behind the `ChatContextKeys.enabled` context key:

https://github.com/microsoft/vscode/blob/2893b0ec8a0da1b01af3dd2ac9cd5f3c2a873b4c/src/vs/workbench/contrib/chat/common/actions/chatContextKeys.ts#L42

And that should suffice because if `chat.disableAIFeatures` is set, we do not install our default implementation. 

Maybe there is a scenario you are hitting that I am not seeing where we have a bug, can you provide more steps?

---

### @dmitrivMS (2026-01-08T11:52:25Z)

@bpasero You are right, these commands do not appear after restart, only if the setting is disabled in the current session.

---

### @bpasero (2026-01-08T11:59:59Z)

@dmitrivMS and to clarify: you have Copilot Chat installed right? You should also test the more common flow where Copilot Chat is not installed as that is the default for most users out of the box.

---

### @bpasero (2026-01-08T12:49:10Z)

It would be great if we could get to the bottom of why a chat agent is still contributed even after extensions restart when Copilot Chat is disabled. Essentially why is this context key not turning false:

https://github.com/microsoft/vscode/blob/2893b0ec8a0da1b01af3dd2ac9cd5f3c2a873b4c/src/vs/workbench/contrib/chat/common/actions/chatContextKeys.ts#L42

When the copilot chat extension is disabled and extension host restarts.

---

### @dmitrivMS (2026-01-08T14:30:55Z)

Upon discussion, the commands I mentioned initially are hidden on restart, so there is no issue there.
@bpasero Has also submitted a PR which will make the disabling of AI work without restart.

---

### @bpasero (2026-01-27T05:48:24Z)

@dmitrivMS no need to set "veriification-needed" on bugs, they will all get verified.

---

### @dmitrivMS (2026-01-27T06:20:55Z)

> [@dmitrivMS](https://github.com/dmitrivMS) no need to set "veriification-needed" on bugs, they will all get verified.

Got it, thanks!

---

### @dmitrivMS (2026-01-27T06:46:29Z)

Ran Get issue details 
Completed with input: {
  "method": "get",
  "owner": "microsoft",
  "repo": "vscode",
  "issue_number": 286498
}

Ran Get commit details 
Completed with input: {
  "owner": "microsoft",
  "repo": "vscode",
  "sha": "f4299c5eb95703334084aab46360db9e4e6426ec"
}

Ran Get file or directory contents 
Completed with input: {
  "owner": "microsoft",
  "repo": "vscode",
  "path": "src/vs/workbench/contrib/chat/common/participants/chatAgents.ts",
  "ref": "f4299c5eb95703334084aab46360db9e4e6426ec"
}



Fetched https://github.com/microsoft/vscode/commit/f4299c5eb95703334084aab46360db9e4e6426ec.diff

Based on my analysis:

**Issue #286498**: Disabling AI does not apply without restart when Copilot installed

**Fix**: In chatAgents.ts, the condition for setting the `_hasDefaultAgent` context key was changed from:
```typescript
agent.data.isDefault
```
to:
```typescript
agent.data.isDefault && !!agent.impl
```

This ensures that when an agent's implementation is disposed (e.g., when disabling AI), the `_hasDefaultAgent` context key (`ChatContextKeys.enabled`) updates immediately, rather than staying `true` just because an agent data entry exists.

---

## Verification Steps

1. **Prerequisites**:
   - Install the Copilot extension
   - Start with AI features enabled

2. **Verify AI is initially enabled**:
   - Open the Command Palette (Ctrl+Shift+P)
   - Confirm Chat / Copilot commands are available
   - Open a file and verify inline completions or chat features work

3. **Disable AI**:
   - Open Settings (Ctrl+,)
   - Search for "chat.agent.enabled" or equivalent AI setting
   - Disable the AI/Copilot features

4. **Verify immediate effect without restart**:
   - AI features should immediately become unavailable
   - Chat panel and AI-related UI elements should reflect the disabled state
   - The `chat.enabled` context key should be `false` (verify via Developer: Inspect Context Keys)

5. **Re-enable AI**:
   - Turn the AI setting back on
   - Verify AI features return without requiring a restart

---
