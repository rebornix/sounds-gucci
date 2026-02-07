# Issue #281642: Background agent session progress changes to worktree name when it's "working..."

**Repository:** microsoft/vscode
**Author:** @rebornix
**Created:** 2025-12-05T23:50:46Z
**Labels:** bug, verified, candidate, chat-agents-view

## Description

Re https://github.com/microsoft/vscode-internalbacklog/issues/6388

![Image](https://github.com/user-attachments/assets/8502940c-7525-41a1-a591-1f6677bde41f)

When the bg session is running, the progress on the agent session view

- Show tool call 1 ...
- Show tool call 2 ...
- 🐛 Show worktree name
- Show tool call 3 ...
- Finished, show file stats

It's probably because when it's "working..." we don't have any progress thus we fall back to the session description

## Comments

(No relevant comments)
