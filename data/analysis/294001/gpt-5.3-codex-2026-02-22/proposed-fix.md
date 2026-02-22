# Bug Analysis: Issue #293503

## Understanding the Bug
The issue reports a high-volume unhandled error:

- `[UriError]: Scheme contains illegal characters.`
- Stack includes `src/vs/platform/log/electron-main/logIpc.ts` at the `deregisterLogger` IPC command path.

From code inspection at parent commit `a5c413088d48bdf56932ab1735cde1cb5446cd65`, the failing path is:

1. renderer/workbench calls `loggerService.deregisterLogger(...)`
2. `LoggerChannelClient.deregisterLogger(...)` forwards the argument to IPC
3. main-process `LoggerChannel.call(..., 'deregisterLogger')` does `URI.revive(arg[0])`
4. if `arg[0]` is a string logger ID containing characters invalid for URI scheme parsing, `URI.revive` throws `[UriError]: Scheme contains illegal characters.`

A concrete string-ID caller exists in MCP server teardown:

- `src/vs/workbench/contrib/mcp/common/mcpServer.ts`
- `toDisposable(() => _loggerService.deregisterLogger(this._loggerId))`

where `_loggerId` is built as `mcpServer.${definition.id}` and `definition.id` may contain characters that are valid for logger IDs but invalid when interpreted as URI scheme text.

## Git History Analysis
I ran incremental history analysis from the parent commit timestamp.

### Time Window Used
- Initial: 24 hours
- Expanded: 3 days
- Final: 7 days (168 hours)

No relevant commits touching the suspect files were found in the 24h/3d/7d windows. This suggests the bug is not from a very recent regression in that window and is better explained by a pre-existing type/IPC mismatch.

I then used blame for precise provenance:

- `src/vs/platform/log/common/logIpc.ts` lines around `deregisterLogger(resource: URI)`
- `src/vs/platform/log/electron-main/logIpc.ts` line handling `'deregisterLogger'` with `URI.revive(arg[0])`
- `src/vs/workbench/contrib/mcp/common/mcpServer.ts` teardown deregistration with string ID

These lines were introduced together (same historical commit), consistent with the mismatch being introduced as part of a larger logging/MCP integration change.

## Root Cause
`ILoggerService.deregisterLogger` contract accepts `URI | string`, but the IPC implementation path effectively assumes URI-shaped data in the main process:

- Renderer/client side can pass string IDs.
- Main side unconditionally calls `URI.revive(arg[0])` for `'deregisterLogger'`.
- For string IDs with non-URI-scheme characters, URI validation fails and throws.

So the root cause is an IPC contract mismatch: string logger IDs are legal at service level but are incorrectly coerced through URI revival in `electron-main/logIpc.ts`.

## Proposed Fix

### Option A: Targeted Fix (Recommended)
**Affected Files:**
- `src/vs/platform/log/electron-main/logIpc.ts`

**Changes Required:**
Handle both valid inputs for `deregisterLogger` at IPC boundary:

- if `arg[0]` is a string, call `this.loggerService.deregisterLogger(arg[0])`
- otherwise revive and pass as URI

This is the minimal and safest fix because it eliminates the crash at the exact failing boundary while preserving existing service semantics.

**Code Sketch:**
```ts
import { isString } from '../../../base/common/types.js';

// ...
case 'deregisterLogger':
	return isString(arg[0])
		? this.loggerService.deregisterLogger(arg[0])
		: this.loggerService.deregisterLogger(URI.revive(arg[0]));
```

### Option B: Comprehensive Fix (Optional)
**Affected Files:**
- `src/vs/platform/log/common/logIpc.ts`
- `src/vs/platform/log/electron-main/logIpc.ts`

**Changes Required:**
- Widen `LoggerChannelClient.deregisterLogger` parameter from `URI` to `URI | string`
- Normalize to a URI before IPC (`const resource = this.toResource(resourceOrId)`) and always send URI-shaped data
- Keep main-process guard from Option A as defensive coding

Trade-off: touches more code but enforces contract consistency and future-proofs against similar call sites.

## Confidence Level: High

## Reasoning
- The telemetry stack points directly to `URI.revive` in main log IPC `deregisterLogger`.
- Service contract permits string IDs.
- There is at least one real string-ID call site (`mcpServer.ts`) on logger disposal.
- Unconditionally reviving as URI is therefore unsafe and explains the observed `UriError`.
- Option A fixes the root cause at the failure boundary with minimal behavioral risk.
