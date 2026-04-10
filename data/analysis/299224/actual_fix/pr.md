# PR #303770: Fix terminal sandbox tmp dir scoping

**Repository:** microsoft/vscode
**Labels:** 
**Merge Commit:** `ae0f754c98e99986c4ffcb8a26b7f442579024a2`
**Parent Commit:** `bb217020c07e2a549c432ca3894fa2b1ce617105`

## Description

## Summary

This change scopes terminal sandbox temporary data to a per-window subdirectory so shutdown cleanup only removes the sandbox files created by the current VS Code window.

## What Changed

- derive a per-window sandbox temp folder name from `environmentService.window?.id`
- create sandbox temp paths under the existing `tmp` root using `tmp_vscode_<windowId>`
- keep cleanup targeted to `this._tempDir`, which now resolves to a window-specific directory
- preserve the existing shared root location under the product data folder for both remote and native environments
- update `TerminalSandboxService` tests to inject a window id and assert the scoped temp directory path
- keep the sandbox command wrapper using `this._execPath` directly when launching the sandbox runtime, and return the wrapped command as-is for remote environments

## Why

Previously, sandbox temp data was stored in a shared `tmp` directory. Because shutdown deletes the resolved sandbox temp directory recursively, closing one window could remove sandbox files that belonged to another open VS Code window. Scoping the temp directory by window id avoids that cross-window cleanup behavior.

## Testing

- `npm run compile-check-ts-native`
- `node ./test/unit/browser/index.js --run src/vs/workbench/contrib/terminalContrib/chatAgentTools/test/browser/terminalSandboxService.test.ts --browser chromium`
- `node --experimental-strip-types build/hygiene.ts src/vs/workbench/contrib/terminalContrib/chatAgentTools/test/browser/terminalSandboxService.test.ts`

Fixes #299224

## Commits

- Fix terminal sandbox tmp dir scoping

## Changed Files

- src/vs/workbench/contrib/terminalContrib/chatAgentTools/common/terminalSandboxService.ts
- src/vs/workbench/contrib/terminalContrib/chatAgentTools/test/browser/terminalSandboxService.test.ts
