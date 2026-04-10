# PR #306553: Remote agent host: fix model picker on new session page

**Repository:** microsoft/vscode
**Labels:** 
**Merge Commit:** `d13d7c7add720c958308ba619e02cd37caffad76`
**Parent Commit:** `9a11a08c75a1d8821b34f8eebd9bcb5b13ecac7b`

## Description

The model picker on the new session page didn't show models for remote agent host sessions. Two issues:

**1. Models never populated:** The remote agent host server initially reports agents with 0 models (before authentication). After auth succeeds, the local agent host calls `refreshModels()` to trigger a root state update with the full model list — but the remote agent host contribution was missing this call. Added `refreshModels()` after `_authenticateWithConnection` and in `_authenticateAllConnections`, matching the local agent host pattern.

**2. Model picker not visible:** The `localModelPicker` action's `when` clause only matched the default Copilot provider (`activeSessionProviderId == 'default-copilot'`). Widened it to also match remote agent host providers via `ContextKeyExpr.regex(ActiveSessionProviderIdContext.key, /^agenthost-/)`. Also made `getAvailableModels` dynamic — it now derives `targetChatSessionType` from the active provider's untitled session resource scheme instead of hardcoding `AgentSessionProviders.Background`.

**Also:** Restores two changes that were accidentally reverted by a bad merge in an earlier PR — the `delegate.setModel` fix (#305345) and multi-select context menu bridge (#306332).

(Written by Copilot)

## Commits

- Revert bad merge from #306130
- Always resolve language models on provider registration
- Merge branch 'main' into roblou/horizontal-jackal
- fix
- fix

## Changed Files

- src/vs/sessions/contrib/copilotChatSessions/browser/copilotChatSessionsActions.ts
- src/vs/sessions/contrib/remoteAgentHost/browser/remoteAgentHost.contribution.ts
