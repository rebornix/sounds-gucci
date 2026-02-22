# Bug Analysis: Issue #293503

## Understanding the Bug

The error `[UriError]: Scheme contains illegal characters.` is thrown at `URI.revive()` when the electron-main process handles a `deregisterLogger` IPC call. The stack trace shows:

```
URI.revive → new Uri → _validateUri → throw "[UriError]: Scheme contains illegal characters."
```

at `logIpc.ts:36` (electron-main):
```typescript
case 'deregisterLogger': return this.loggerService.deregisterLogger(URI.revive(arg[0]));
```

This error affects 566.8K users with 1.4M hits, occurring across all platforms.

## Git History Analysis

### Time Window Used
- Initial: 24 hours
- Final: 168 hours (expanded 2 times)

No directly relevant commits to `src/vs/platform/log/` were found in the 7-day window before the parent commit. The bug is a longstanding type mismatch, not a regression from a recent commit.

## Root Cause

The `ILoggerService.deregisterLogger` interface accepts `URI | string`:

```typescript
// src/vs/platform/log/common/log.ts:243
deregisterLogger(idOrResource: URI | string): void;
```

However, `LoggerChannelClient.deregisterLogger` (the IPC client) narrows the parameter to `URI` only and sends the raw value over IPC without converting string IDs to URIs:

```typescript
// src/vs/platform/log/common/logIpc.ts:48-51
override deregisterLogger(resource: URI): void {
    super.deregisterLogger(resource);
    this.channel.call('deregisterLogger', [resource, this.windowId]);
}
```

When a caller passes a **string ID** (e.g., `"mcpServer.someId/withSlash"`), the raw string is sent over IPC. The electron-main handler then calls `URI.revive(arg[0])` on this string. `URI.revive` passes the string into the `URI` constructor as the `scheme` parameter, and `_validateUri` rejects it because the string contains characters illegal in a URI scheme (e.g., `/`, `:`, spaces).

**The specific caller triggering this is `mcpServer.ts:453`:**

```typescript
// src/vs/workbench/contrib/mcp/common/mcpServer.ts:445,453
this._loggerId = `mcpServer.${definition.id}`;
this._register(toDisposable(() => _loggerService.deregisterLogger(this._loggerId)));
```

MCP server definition IDs can contain characters like `/` that are illegal in URI schemes.

**Contrast with `setVisibility`**, which handles this correctly by converting string IDs to URIs before sending over IPC:

```typescript
// src/vs/platform/log/common/logIpc.ts:60-63
override setVisibility(resourceOrId: URI | string, visibility: boolean): void {
    super.setVisibility(resourceOrId, visibility);
    this.channel.call('setVisibility', [this.toResource(resourceOrId), visibility]);
}
```

`deregisterLogger` is simply missing this `toResource()` conversion — an inconsistency with the other methods in the same class.

## Proposed Fix

### Option A: Targeted Fix (Recommended)

**Affected Files:**
- `src/vs/platform/log/common/logIpc.ts`

**Changes Required:**

Fix `LoggerChannelClient.deregisterLogger` to:
1. Accept `URI | string` (matching the base `ILoggerService` interface)
2. Convert string IDs to URIs via `this.toResource()` before sending over IPC (consistent with `setVisibility`)

**Code Sketch:**

```typescript
// src/vs/platform/log/common/logIpc.ts:48-51 (before)
override deregisterLogger(resource: URI): void {
    super.deregisterLogger(resource);
    this.channel.call('deregisterLogger', [resource, this.windowId]);
}

// (after)
override deregisterLogger(idOrResource: URI | string): void {
    super.deregisterLogger(idOrResource);
    this.channel.call('deregisterLogger', [this.toResource(idOrResource), this.windowId]);
}
```

### Option B: Defensive Server-Side Fix (Belt and suspenders)

Additionally harden the electron-main IPC handler to gracefully handle strings:

**Affected Files:**
- `src/vs/platform/log/electron-main/logIpc.ts`

**Code Sketch:**

```typescript
// src/vs/platform/log/electron-main/logIpc.ts:36 (before)
case 'deregisterLogger': return this.loggerService.deregisterLogger(URI.revive(arg[0]));

// (after)
case 'deregisterLogger': return this.loggerService.deregisterLogger(typeof arg[0] === 'string' ? arg[0] : URI.revive(arg[0]));
```

This ensures the server side doesn't crash even if a string slips through the IPC channel.

## Confidence Level: High

## Reasoning

1. **Direct trace to the crash**: The stack trace points exactly to `URI.revive(arg[0])` in `logIpc.ts:36`, which is called when the `deregisterLogger` command is received over IPC.

2. **Known string caller**: `mcpServer.ts:453` explicitly passes a string ID (`this._loggerId = "mcpServer.${definition.id}"`) to `deregisterLogger`. MCP server IDs containing `/` or other non-scheme characters will trigger the URI validation error.

3. **Inconsistency with peer methods**: `setVisibility` in the same class correctly converts `URI | string` to a URI via `this.toResource()` before sending over IPC. `deregisterLogger` is missing this conversion — a clear oversight.

4. **Mental validation**: After the fix, a string ID like `"mcpServer.extension/server"` flows through `this.toResource()` → `joinPath(this.logsHome, "mcpServerextensionserver.log")` → a valid URI → serialized over IPC → `URI.revive(uriObject)` → succeeds. The specific symptom (scheme validation error) is eliminated.
