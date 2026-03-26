# Bug Analysis: Issue #269810

## Understanding the Bug

High-volume telemetry: `loggerIpc#deregisterLogger` fails with **URI / path errors** (“Scheme contains illegal characters”). The failure is associated with `URI.revive` on the argument in `LoggerChannel.call` → `deregisterLogger` (`src/vs/platform/log/electron-main/logIpc.ts`). The stack points at IPC handling when the renderer notifies the main process to remove a logger.

## Git History Analysis

Within a few days before parent `940183214480d867f179b9146e116d870f1c77dc`, only the merge parent appeared in the sampled log; the bug is explained by current logger URI construction rather than a nearby regression commit.

### Time Window Used

- Initial: 24 hours  
- Final: 3 days  

## Root Cause

`AbstractLoggerService.toResource` maps a **string** logger id to a file URI via `joinPath(this.logsHome, \`${idOrResource}.log\`)` (`src/vs/platform/log/common/log.ts`). Dynamic authentication providers set `this.id` to the **full string form of the authorization server URI**, optionally concatenated with a resource string (`extHostAuthentication.ts`: `stringifiedServer + ' ' + resource`). That string can contain spaces, colons, slashes, query characters, etc. Those characters are unsafe as a single path segment on some platforms and can produce invalid or non-round-trippable URIs when serialized through IPC and passed to `URI.revive`, matching the error volume on `deregisterLogger`.

Metadata PR title (“illegal characters in Dynamic Auth Provider **logger filename**”) aligns with sanitizing or hashing the id used for the log file path.

## Proposed Fix

### Option A: Targeted Fix (Recommended)

**Affected Files:**

- `src/vs/workbench/api/common/extHostAuthentication.ts` (constructor of `DynamicAuthProvider`)

**Changes Required:**

When calling `loggerService.createLogger`, **do not pass the raw `this.id`** as the string resource key. Instead:

1. Derive a **filesystem-safe logger id**, e.g. `hash(this.id).toString(16)` (reuse the same `hash` helper already used elsewhere in `log.ts` for URI-based ids) or a base64url / hex encoding of a digest of `this.id`.

2. Pass the human-readable label in `ILoggerOptions.name` (already `Auth: ${this.label}`) so logs remain identifiable.

3. Ensure the same derived id is used consistently for the lifetime of the provider so `deregisterLogger` resolves the same resource.

**Code Sketch:**

```typescript
import { hash } from '../../../../base/common/hash.js';
// ...
const loggerId = hash(this.id).toString(16);
this._logger = loggerService.createLogger(loggerId, { name: `Auth: ${this.label}` });
```

### Option B: Comprehensive Fix (Optional)

Centralize sanitization in `AbstractLoggerService.toResource` for **all** string ids (e.g. replace path-forbidden characters or always hash non-trivial strings). This protects other call sites but changes path layout for every string-keyed logger.

## Confidence Level: High

## Reasoning

The failure mode is specifically tied to logger resources flowing through IPC as URIs. Dynamic auth uses an unconstrained URL-derived string as the id that becomes a path segment; that directly explains illegal-character and revive failures. Hashing or sanitizing at the provider matches the PR title and fixes both registration and deregister round-trips without weakening logging (display name stays in options).
