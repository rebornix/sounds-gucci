# PR #304286: fix: re-layout list when toggling browse mode in MCP/plugin widgets

**Repository:** microsoft/vscode
**Labels:** candidate
**Merge Commit:** `4fb07896862c03e740c0513292656cfac3ed9c7c`
**Parent Commit:** `bc80ed36d187fd569c9fd123883f6a0e6860c04d`

## Description

When toggling browse mode, the back link appears/disappears but layout() was never re-called, causing the list height to not account for the changed chrome. This clipped the last entry.

Cache the last layout dimensions and re-call layout() after toggling browse mode.

Fixes https://github.com/microsoft/vscode/issues/304139

<!-- Thank you for submitting a Pull Request. Please:
* Read our Pull Request guidelines:
  https://github.com/microsoft/vscode/wiki/How-to-Contribute#pull-requests
* Associate an issue with the Pull Request.
* Ensure that the code is up-to-date with the `main` branch.
* Include a description of the proposed changes and how to test them.
-->

## Commits

- fix: re-layout list when toggling browse mode in MCP/plugin widgets

## Changed Files

- src/vs/workbench/contrib/chat/browser/aiCustomization/mcpListWidget.ts
- src/vs/workbench/contrib/chat/browser/aiCustomization/pluginListWidget.ts
