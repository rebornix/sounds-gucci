# PR #303856: fix: remove backslash escaping from terminal command labels

**Repository:** microsoft/vscode
**Labels:** 
**Merge Commit:** `a7e3a4e1e5468c745382150985a870ee554f64c5`
**Parent Commit:** `12e343fccb9f671e594590e0c0a26cee6e5aca84`

## Description

Fixes #303844

## Problem
Command labels in the terminal collapsible wrapper show backslash-escaped characters (e.g., `ls \-lh` instead of `ls -lh`).

## Root cause
Commit ac2da2ad982 added `escapeMarkdownSyntaxTokens(commandText)` in `ChatTerminalThinkingCollapsibleWrapper`, which escapes characters like `-`, `*`, `#` etc. with backslashes. This is unnecessary because the command text is always placed inside:
- Markdown code spans (\`...\`) where content is already literal
- `.textContent` assignments where content is also literal

## Fix
Remove the `escapeMarkdownSyntaxTokens` calls from the constructor. Also adds a component fixture for the terminal collapsible wrapper to enable visual regression testing.

## Validation
- Compilation clean
- Existing tests pass (11/11)
- Visual verification via component explorer screenshots

## Commits

- fix: remove escapeMarkdownSyntaxTokens from terminal command labels
- fix: use DOM nodes instead of MarkdownString for sandbox command labels
- fix: remove colons from fixture names to fix CI artifact paths
- add screenshot baselines for terminal collapsible fixtures

## Changed Files

- src/vs/workbench/contrib/chat/browser/widget/chatContentParts/toolInvocationParts/chatTerminalToolProgressPart.ts
- src/vs/workbench/test/browser/componentFixtures/chatTerminalCollapsible.fixture.ts
- test/componentFixtures/.screenshots/baseline/chat/terminalCollapsible/chatTerminalCollapsible/Ran - backticks/Dark.png
- test/componentFixtures/.screenshots/baseline/chat/terminalCollapsible/chatTerminalCollapsible/Ran - backticks/Light.png
- test/componentFixtures/.screenshots/baseline/chat/terminalCollapsible/chatTerminalCollapsible/Ran - simple command/Dark.png
- test/componentFixtures/.screenshots/baseline/chat/terminalCollapsible/chatTerminalCollapsible/Ran - simple command/Light.png
- test/componentFixtures/.screenshots/baseline/chat/terminalCollapsible/chatTerminalCollapsible/Ran - special chars/Dark.png
- test/componentFixtures/.screenshots/baseline/chat/terminalCollapsible/chatTerminalCollapsible/Ran - special chars/Light.png
- test/componentFixtures/.screenshots/baseline/chat/terminalCollapsible/chatTerminalCollapsible/Ran sandbox - backticks/Dark.png
- test/componentFixtures/.screenshots/baseline/chat/terminalCollapsible/chatTerminalCollapsible/Ran sandbox - backticks/Light.png
- test/componentFixtures/.screenshots/baseline/chat/terminalCollapsible/chatTerminalCollapsible/Ran sandbox - powershell backticks/Dark.png
- test/componentFixtures/.screenshots/baseline/chat/terminalCollapsible/chatTerminalCollapsible/Ran sandbox - powershell backticks/Light.png
- test/componentFixtures/.screenshots/baseline/chat/terminalCollapsible/chatTerminalCollapsible/Ran sandbox - simple command/Dark.png
- test/componentFixtures/.screenshots/baseline/chat/terminalCollapsible/chatTerminalCollapsible/Ran sandbox - simple command/Light.png
- test/componentFixtures/.screenshots/baseline/chat/terminalCollapsible/chatTerminalCollapsible/Ran sandbox - special chars/Dark.png
- test/componentFixtures/.screenshots/baseline/chat/terminalCollapsible/chatTerminalCollapsible/Ran sandbox - special chars/Light.png
- test/componentFixtures/.screenshots/baseline/chat/terminalCollapsible/chatTerminalCollapsible/Running - simple command/Dark.png
- test/componentFixtures/.screenshots/baseline/chat/terminalCollapsible/chatTerminalCollapsible/Running - simple command/Light.png
- test/componentFixtures/.screenshots/baseline/chat/terminalCollapsible/chatTerminalCollapsible/Running sandbox - simple command/Dark.png
- test/componentFixtures/.screenshots/baseline/chat/terminalCollapsible/chatTerminalCollapsible/Running sandbox - simple command/Light.png
