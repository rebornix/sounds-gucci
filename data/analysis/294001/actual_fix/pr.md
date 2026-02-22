# PR #294001: Fix URI scheme error in LoggerChannelClient.deregisterLogger

**Repository:** microsoft/vscode
**Labels:** 
**Merge Commit:** `0c3d14a4802fd082e75ce6360d39c8f8f3c11992`
**Parent Commit:** `a5c413088d48bdf56932ab1735cde1cb5446cd65`

## Description

Fixes #293503

## Problem

`LoggerChannelClient.deregisterLogger` narrowed its parameter type to only `URI`, but the base interface `ILoggerService.deregisterLogger` accepts `URI | string`. Callers passing string logger IDs (e.g., MCP server passing `this._loggerId`) sent raw strings over IPC. On the main process, `URI.revive(stringValue)` treated the entire string as a URI scheme, which failed `_validateUri` with `[UriError]: Scheme contains illegal characters.`

This was the #1 unhandled error by volume: **1.4M hits, 567K affected users**.

## Fix

1. **Producer fix** (`src/vs/platform/log/common/logIpc.ts`): Changed `deregisterLogger` to accept `URI | string` and call `this.toResource(idOrResource)` before sending over IPC — matching the pattern already used by `setVisibility`.

2. **Error enrichment** (`src/vs/base/common/uri.ts`): Enhanced the `_validateUri` error message to include the actual invalid scheme value (truncated to 50 chars) and its length, so future telemetry from any call site reveals what data was passed.

## Commits

- Add guidelines and prompt for fixing unhandled errors from VS Code er…
- Fix URI scheme error in LoggerChannelClient.deregisterLogger (#293503)
- Improve URI scheme error message to specify illegal characters found
- Update src/vs/platform/log/common/logIpc.ts
- Enhance URI scheme error message to include length and clarify illega…
- Enhance URI scheme validation error message to include index of illeg…

## Changed Files

- .github/prompts/fix-error.prompt.md
- .github/skills/fix-errors/SKILL.md
- src/vs/base/common/uri.ts
- src/vs/platform/log/common/logIpc.ts
