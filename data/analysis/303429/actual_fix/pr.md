# PR #304235: fixes window.title

**Repository:** microsoft/vscode
**Labels:** candidate, command-center
**Merge Commit:** `2dec0ace830afbeb79b1480cf04f7375e82e2700`
**Parent Commit:** `85ba79cf0226ebf10f7abf28b86a5ed1b27a1c00`

## Description

<!-- Thank you for submitting a Pull Request. Please:
* Read our Pull Request guidelines:
  https://github.com/microsoft/vscode/wiki/How-to-Contribute#pull-requests
* Associate an issue with the Pull Request.
* Ensure that the code is up-to-date with the `main` branch.
* Include a description of the proposed changes and how to test them.
-->

fixes https://github.com/microsoft/vscode/issues/303429

Steps to repro:
1. Set agent status to compact if it is not already
2. Change window.title to `${rootName} - ${activeRepositoryBranchName}` then `${activeRepositoryName}${separator}${activeFolderMedium}`
3. Correct title should show in command center placeholder text

## Commits

- fixes window.title
- Merge branch 'release/1.113' into eli/compact-rev2

## Changed Files

- src/vs/workbench/contrib/chat/browser/agentSessions/experiments/agentTitleBarStatusWidget.ts
