# PR #304327: fix: correct terminal sandbox icon in thinking dropdown

**Repository:** microsoft/vscode
**Labels:** 
**Merge Commit:** `5d82d8ab1edcdd6bb4bf4df0ade8f486759f346a`
**Parent Commit:** `0f66161e3623cf3b58e7484d1c89e231936a1c0e`

## Description

When sandbox is enabled, the tool-level icon was set to terminalSecure (lock) at registration time, which leaked into every rendering path during streaming before we knew if a specific command was actually sandboxed. This caused unsandboxed commands (requestUnsandboxedExecution=true) to show the lock icon.

Fix:
- Set toolData.icon to always be Codicon.terminal (no lock). The per-command isSandboxWrapped flag in toolSpecificData is the authoritative source.
- In the existing autorun in trackToolMetadata, update the icon element when the tool transitions out of streaming and toolSpecificData becomes available.
- Store icon elements in toolIconsByCallId map for direct access.

Fixes #303505

## Commits

- fix: correct terminal sandbox icon in thinking dropdown
- Merge branch 'main' into alexd/administrative-landfowl

## Changed Files

- src/vs/workbench/contrib/chat/browser/widget/chatContentParts/chatThinkingContentPart.ts
- src/vs/workbench/contrib/terminalContrib/chatAgentTools/browser/tools/runInTerminalTool.ts
