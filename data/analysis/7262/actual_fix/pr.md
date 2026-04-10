# PR #306467: Fix over requesting of MCP registry

**Repository:** microsoft/vscode
**Labels:** 
**Merge Commit:** `7836a50b5765a5f3a62e6a5ea4e4dbe64584d266`
**Parent Commit:** `61e3ba6f0478142386500e4d17fc04ee319c8dcd`

## Description

<!-- Thank you for submitting a Pull Request. Please:
* Read our Pull Request guidelines:
  https://github.com/microsoft/vscode/wiki/How-to-Contribute#pull-requests
* Associate an issue with the Pull Request.
* Ensure that the code is up-to-date with the `main` branch.
* Include a description of the proposed changes and how to test them.
-->
Sneaky `undefined !== '0' -> true.

Part of https://github.com/microsoft/vscode-internalbacklog/issues/7262

cc @connor4312 

## Commits

- undefined !== '0' is true
- Merge branch 'main' into lramos15/odd-ape
- Merge branch 'main' into lramos15/odd-ape

## Changed Files

- src/vs/workbench/services/accounts/browser/defaultAccount.ts
