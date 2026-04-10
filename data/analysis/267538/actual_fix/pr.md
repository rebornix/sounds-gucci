# PR #306226: fix: scope editor service in window title to own editor groups container

**Repository:** microsoft/vscode
**Labels:** 
**Merge Commit:** `4003d390fb8747be92b4e66c280584cf92579d16`
**Parent Commit:** `c2016b08f5d48a676858f04907c2b1c10ab03a44`

## Description

## What kind of change does this PR introduce?

Bug fix

## What is the current behavior?

The main window's `WindowTitle` uses the global `IEditorService`, which tracks editor groups across all windows including auxiliary windows. When a terminal is moved from the panel to a new auxiliary window via "Move Terminal into New Window", the following sequence occurs:

1. The terminal is removed from the panel group
2. A new auxiliary editor part is created and the terminal opens as an editor there
3. The auxiliary window gains focus
4. The global `EditorParts.activePart` now returns the auxiliary part (based on `getActiveDocument()`)
5. The global `EditorService` fires `onDidActiveEditorChange`
6. The main window's `WindowTitle` reads `editorService.activeEditor`, which resolves through `activePart` to the auxiliary window's terminal editor
7. The main window title incorrectly updates to show the terminal name (e.g. "bash") instead of the open file

This also affects any editor moved to a new auxiliary window, not just terminals.

Closes #267538

## What is the new behavior?

Each `WindowTitle` now receives a scoped `IEditorService` that only tracks editors within its own window's editor groups container. This is done by creating a child instantiation service with a scoped editor service in the `BrowserTitlebarPart` constructor:

- For the **main window**: the editor service is scoped to `editorGroupService.mainPart`, so it only tracks editors in the main window
- For **auxiliary windows**: the scoping is consistent with the existing approach used in `auxiliaryEditorPart.ts` (line 202-203), where a scoped editor service is already created for the auxiliary editor part

After the fix, moving a terminal (or any editor) to a new window no longer affects the original window's title.

## Additional context

The auxiliary window's `WindowTitle` was already getting a correctly scoped editor service via `scopedEditorPartInstantiationService` (created in `auxiliaryEditorPart.ts`). The main window's `WindowTitle` was the only one using the global (unscoped) editor service, which made it susceptible to cross-window active editor changes.

The fix follows the same scoping pattern already established for auxiliary windows but applies it uniformly in `BrowserTitlebarPart` for all windows.

## Commits

- fix: scope editor service in window title to own editor groups container
- scope entire instantiator
- compile
- polish

## Changed Files

- src/vs/workbench/browser/parts/titlebar/titlebarPart.ts
