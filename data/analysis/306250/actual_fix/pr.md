# PR #306337: actionWidget: fix submenu group label rendered as item description (#306327)

**Repository:** microsoft/vscode
**Labels:** 
**Merge Commit:** `9d3144bf84f54ab1e886fca20608dd3ddc296f64`
**Parent Commit:** `ee6bfc559a9089feb8b73962fd4fb5a306821ef4`

## Description

The submenu header (e.g. 'Thinking effort') was incorrectly shown as the description of the first action item instead of as a proper section header.

Regression from f6218ecb334 which replaced ActionListItemKind.Header items with inline description on the first child action.

Restore proper Header rendering for SubmenuAction groups that have a label. For the sessions workspace picker, move the provider label to the first child action's tooltip so it renders as a description instead of a header.

Fixes #306250

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>

## Commits

- actionWidget: fix submenu group label rendered as item description (#…

## Changed Files

- src/vs/platform/actionWidget/browser/actionList.ts
- src/vs/sessions/contrib/chat/browser/sessionWorkspacePicker.ts
