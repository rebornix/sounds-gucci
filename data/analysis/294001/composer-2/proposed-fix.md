# Bug Analysis: Issue #293503

## Understanding the Bug

Telemetry reports a high-volume unhandled error: **`[UriError]: Scheme contains illegal characters.`** The stack trace shows the failure on the **main process** when handling the logger IPC channel:

- `LoggerChannel` (`src/vs/platform/log/electron-main/logIpc.ts`) dispatches `deregisterLogger` and calls `URI.revive(arg[0])` before `ILoggerMainService#deregisterLogger`.
- The error originates from URI validation (`_schemePattern` in `src/vs/base/common/uri.ts`) when constructing/reviving a URI whose `scheme` does not match `^\w[\w\d+.-]*$`.

So the main process is sometimes given **marshalled logger resource data that does not survive revival as a valid URI** (or is not normalized the same way as other logger IPC paths).

## Git History Analysis

```bash
parent=a5c413088d48bdf56932ab1735cde1cb5446cd65
git log --oneline -20 --until="$(git show -s --format=%cI "$parent")" "$parent" \
  -- src/vs/platform/log/common/logIpc.ts src/vs/platform/log/electron-main/logIpc.ts
```

Only unrelated history surfaced in a short window; the issue is best explained by **code-path inspection** and the stack pointing at `deregisterLogger` + `URI.revive`.

### Time Window Used

- Initial: 24 hours before parent (no `src/vs/platform/log/` commits in that slice)
- Final: extended listing for the two `logIpc.ts` files up to parent — minimal relevant history

## Root Cause

In `LoggerChannelClient` (`src/vs/platform/log/common/logIpc.ts`), the `onDidChangeLoggers` listener **revives** resources for **added** loggers but **does not revive** resources for **removed** loggers:

- **Added:** `super.registerLogger({ ...loggerResource, resource: URI.revive(loggerResource.resource) });`
- **Removed:** `super.deregisterLogger(loggerResource.resource);` ← still raw IPC payload

The same asymmetry exists in `RemoteLoggerChannelClient` for the `removed` branch.

After IPC deserialization, `loggerResource.resource` is **plain `UriComponents` / marshalled shape**, not a `URI` instance. Passing it straight into `deregisterLogger` leads to `channel.call('deregisterLogger', [resource, ...])` with data that can **round-trip differently** than when the client explicitly revives first (as it does for `added`). That yields invalid or inconsistent `scheme` (or other component) values on the main side when `URI.revive(arg[0])` runs in `electron-main/logIpc.ts`, triggering `Scheme contains illegal characters`.

## Proposed Fix

### Option A: Targeted Fix (Recommended)

**Affected files:**

- `src/vs/platform/log/common/logIpc.ts`

**Changes required:**

1. In `LoggerChannelClient`’s `onDidChangeLoggers` handler, **revive** the resource for removed loggers, mirroring `added`:

   - Replace `super.deregisterLogger(loggerResource.resource)` with  
     `super.deregisterLogger(URI.revive(loggerResource.resource))`.

2. In `RemoteLoggerChannelClient`’s `onDidChangeLoggers` handler, apply the same change for the `removed` loop:  
   `loggerService.deregisterLogger(URI.revive(loggerResource.resource))`.

This keeps all logger add/remove paths consistent: every resource coming from IPC is revived before touching local service state or re-sending over IPC to the main logger channel.

**Code sketch:**

```typescript
// LoggerChannelClient — inside channel.listen('onDidChangeLoggers', ...)
for (const loggerResource of removed) {
	super.deregisterLogger(URI.revive(loggerResource.resource));
}

// RemoteLoggerChannelClient — same event listener
for (const loggerResource of removed) {
	loggerService.deregisterLogger(URI.revive(loggerResource.resource));
}
```

### Option B: Comprehensive Fix (Optional)

Add a defensive guard on the main side (`electron-main/logIpc.ts`) around `URI.revive` for `deregisterLogger` (e.g. validate / catch and no-op or log). **Trade-off:** hides bad payloads instead of fixing the producer; prefer Option A unless you want belt-and-suspenders for older clients.

## Confidence Level: High

## Reasoning

- The stack trace pins the crash to **`URI.revive` in the `deregisterLogger` IPC handler** on the main logger channel.
- The client code shows an **obvious inconsistency**: `URI.revive` for `added` but not for `removed` in the same event, which is exactly the path that ends up calling `deregisterLogger` over IPC.
- Aligning `removed` with `added` is minimal, matches existing patterns (`onDidChangeLogLevel`, `onDidChangeVisibility` already use `URI.revive`), and should stop invalid URI component shapes from reaching the main process for this event-driven deregistration path.
