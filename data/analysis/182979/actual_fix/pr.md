# PR #304802: fix: prevent terminal panel from overwriting terminalEditorActive context key

**Repository:** microsoft/vscode
**Labels:** 
**Merge Commit:** `bf4a0eb258dd27981b5d660d93e5a47d7d46e6ed`
**Parent Commit:** `1974322e5c2bfee74cb723ebe8456232b1d2e5f3`

## Description

## What kind of change does this PR introduce?

Bug fix

## What is the current behavior?

When both a terminal editor and a terminal panel are present, focusing the terminal panel incorrectly sets `terminalEditorActive` to `false`, even though the active editor is still a terminal editor (`activeEditor == terminalEditor`). This creates an inconsistent state where `activeEditor` is `terminalEditor` but `terminalEditorActive` is `false`.

Fixes #182979

## What is the new behavior?

The `terminalEditorActive` context key now correctly reflects whether the active editor is a terminal editor, regardless of which terminal instance is currently focused. Focusing a terminal in the panel no longer overwrites this context key.

## Additional context

The root cause was duplicate management of the `terminalEditorActive` context key:

1. **`TerminalEditorService`** correctly sets it via `onDidActiveEditorChange`, checking if the active editor is a `TerminalEditorInput`
2. **`TerminalService`** incorrectly overwrote it via `onDidChangeActiveInstance`, setting it based on the active terminal instance's target location

When a panel terminal was focused, `onDidChangeActiveInstance` fired and set `terminalEditorActive` to `false` (because the active instance was in the panel), overriding the correct value from `TerminalEditorService`.

The fix removes the duplicate `terminalEditorActive` management from `TerminalService`, leaving it solely to `TerminalEditorService` which already handles it correctly.

## Commits

- fix: prevent terminal panel from overwriting terminalEditorActive con…
- Merge branch 'main' into fix/terminal-editor-active-context-key
- Merge branch 'main' into fix/terminal-editor-active-context-key

## Changed Files

- src/vs/workbench/contrib/terminal/browser/terminalService.ts
