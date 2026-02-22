# PR #280217: Fix illegal characters in Dynamic Auth Provider logger filename

**Repository:** microsoft/vscode
**Labels:** 
**Merge Commit:** `2d96f38ce6ffb7355ade0ad99ca2dcb927d298ae`
**Parent Commit:** `940183214480d867f179b9146e116d870f1c77dc`

## Description

The Dynamic Auth Provider was using the full authorization server URL (e.g., 'https://example.com/') as the logger ID, which caused 'Illegal characters in path' errors on Windows when mkdirp tried to create the log file directory.

This change sanitizes the provider ID before using it as a logger filename by replacing characters illegal in file paths (:, /, ?, *, etc.) with underscores.

Changes:
- Added sanitizeForFilename() private method to DynamicAuthProvider
- Updated logger creation to use sanitized ID
- Added unit tests for filename sanitization

Example transformation:
  Before: 'https://example.com/' After:  'https___example.com_'

Fixes dynamic auth provider initialization on Windows with MCP servers.

<!-- Thank you for submitting a Pull Request. Please:
* Read our Pull Request guidelines:
  https://github.com/microsoft/vscode/wiki/How-to-Contribute#pull-requests
* Associate an issue with the Pull Request.
* Ensure that the code is up-to-date with the `main` branch.
* Include a description of the proposed changes and how to test them.
-->

## Commits

- Sanitize logger ID to remove illegal filename characters

## Changed Files

- src/vs/platform/log/common/log.ts
