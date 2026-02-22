# PR #287189: fix undefined property error from getViewLineMinColumn

**Repository:** microsoft/vscode
**Labels:** 
**Merge Commit:** `aee9b1b3f6916f1e177d2945389cdbeb655e1654`
**Parent Commit:** `3df70f337dc3638daaa337c694363957296934ee`

## Description

<!-- Thank you for submitting a Pull Request. Please:
* Read our Pull Request guidelines:
  https://github.com/microsoft/vscode/wiki/How-to-Contribute#pull-requests
* Associate an issue with the Pull Request.
* Ensure that the code is up-to-date with the `main` branch.
* Include a description of the proposed changes and how to test them.
-->
Fixes https://github.com/microsoft/vscode/issues/284539

## Commits

- fix: prevent setting viewport when there are no visible lines

## Changed Files

- src/vs/editor/common/viewModel/viewModelImpl.ts
