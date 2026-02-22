# PR #281673: Fix edge case for in progress session

**Repository:** microsoft/vscode
**Labels:** 
**Merge Commit:** `6801a977175147578333faaffeab6a95af8c43b1`
**Parent Commit:** `16bb4a308a90e36f8597a0e344b9fa5a99247213`

## Description

<!-- Thank you for submitting a Pull Request. Please:
* Read our Pull Request guidelines:
  https://github.com/microsoft/vscode/wiki/How-to-Contribute#pull-requests
* Associate an issue with the Pull Request.
* Ensure that the code is up-to-date with the `main` branch.
* Include a description of the proposed changes and how to test them.
-->

Fixes: https://github.com/microsoft/vscode/issues/281642

Fixing an issue when we flickr for a quick moment when the session is in progress and also has a description.

With this small refactor things are easier to follow and we make sure we override the descrpition when the session is in progress, even if that means removing it

## Commits

- Fix edge case for in progress session

## Changed Files

- src/vs/workbench/api/browser/mainThreadChatSessions.ts
- src/vs/workbench/contrib/chat/browser/agentSessions/localAgentSessionsProvider.ts
- src/vs/workbench/contrib/chat/browser/chatSessions.contribution.ts
- src/vs/workbench/contrib/chat/common/chatSessionsService.ts
- src/vs/workbench/contrib/chat/test/common/mockChatSessionsService.ts
