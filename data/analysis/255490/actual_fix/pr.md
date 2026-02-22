# PR #255490: add layover to new cells correctly and dispose of listeners as cells are removed

**Repository:** microsoft/vscode
**Labels:** 
**Merge Commit:** `ce37a385e43c4cfa00f150801e0575f32db40bbc`
**Parent Commit:** `d9d3f3c6ec078295746c5f3b7ac21f608af15552`

## Description

found while looking for a cause of https://github.com/microsoft/vscode/issues/251601.
One issue was straight forward, we didn't stop updating the overlay for a cell after it was removed from the notebook.

The other is a little sneakier - if you add a handler to the viewModel's `onDidChangeViewCells`, it is called before the listView's handler, which means you can work with cells that were just added to the viewModel, but haven't yet been added to the ListView, which can causes an Invalid index error in `NotebookCellList.getCellViewScrollTop`.
Checking `cell.layoutInfo.layoutState > 0` seems to work fine to guard against this.

## Commits

- add layover to new cells correctly and dispose of listeners as cells …
- cleanup

## Changed Files

- src/vs/workbench/contrib/notebook/browser/contrib/troubleshoot/layout.ts
