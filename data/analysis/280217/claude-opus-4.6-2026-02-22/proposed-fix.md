# Bug Analysis: Issue #269810

## Understanding the Bug

The error `loggerIpc#deregisterLogger fails with Scheme contains illegal characters` is a very high-frequency bug reported via error telemetry from millions of machines. The error occurs in `src/vs/platform/log/electron-main/logIpc.ts` at the `deregisterLogger` IPC handler, where a URI with illegal scheme characters is encountered.

The issue was created on Oct 4, 2025, and a follow-up comment on Nov 30 confirmed it was still the top error by count.

## Git History Analysis

### Time Window Used
- Initial: 24 hours
- Final: 168 hours (expanded 2 times)

The sole relevant commit in the window was `a54825d19b5` (Dec 3, 2025), which created `src/vs/workbench/api/common/extHostAuthentication.ts` as a new file. This commit introduced the `DynamicAuthProvider` class, which creates a logger using its auth provider ID as the logger string identifier.

## Root Cause

The `DynamicAuthProvider` class creates a logger at line 407 of `extHostAuthentication.ts`:

```typescript
this._logger = loggerService.createLogger(this.id, { name: `Auth: ${this.label}` });
```

Where `this.id` is constructed from the authorization server URL (lines 399-403):

```typescript
const stringifiedServer = authorizationServer.toString(true);
this.id = _resourceMetadata?.resource
    ? stringifiedServer + ' ' + _resourceMetadata?.resource
    : stringifiedServer;
```

This produces values like `https://login.microsoftonline.com/tenantid/v2.0` or `https://login.microsoftonline.com/tenantid/v2.0 https://api.example.com/v1`.

When `AbstractLoggerService.createLogger(id, ...)` receives a string ID, it converts it to a file URI via `toResource()`:

```typescript
protected toResource(idOrResource: string | URI): URI {
    return isString(idOrResource) ? joinPath(this.logsHome, `${idOrResource}.log`) : idOrResource;
}
```

This creates a file path like `/path/to/logs/https:/login.microsoftonline.com/tenantid/v2.0.log`, which contains:
- `:` characters (illegal in Windows filenames, and problematic in URI paths)
- `/` separators from the URL that `posix.join` interprets as path separators, creating deep nested directory structures
- Spaces (when resource metadata is present)

When this malformed logger resource URI is later processed through the IPC `URITransformer` (in `src/vs/base/common/uriIpc.ts` lines 44-46), the transformer calls `URI.from(result)` which invokes the string-parameter URI constructor. This constructor calls `_validateUri()` which validates the scheme against `_schemePattern = /^\w[\w\d+.-]*$/`. The URI reconstruction fails when the path/scheme contains characters from the original URL, producing the "Scheme contains illegal characters" error.

By contrast, all other logger IDs in the codebase use simple, filesystem-safe strings like `'main'`, `'sharedprocess'`, `'cli'`, `'ptyhost'`, `'remoteagent'`, `'mcpServer.${id}'`, etc.

## Proposed Fix

### Option A: Targeted Fix (Recommended)

**Affected Files:**
- `src/vs/workbench/api/common/extHostAuthentication.ts`

**Changes Required:**
Sanitize the auth provider ID before using it as a logger filename. Replace characters that are illegal in filenames and URI schemes with underscores.

**Code Sketch:**

```typescript
// In DynamicAuthProvider constructor, line 407
// Before:
this._logger = loggerService.createLogger(this.id, { name: `Auth: ${this.label}` });

// After:
const loggerId = `auth.${this.id.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
this._logger = loggerService.createLogger(loggerId, { name: `Auth: ${this.label}` });
```

This replaces all characters that are not alphanumeric, `.`, or `-` with underscores. For an auth server URL like `https://login.microsoftonline.com/tenantid/v2.0`, this produces `auth.https___login.microsoftonline.com_tenantid_v2.0` — a safe, flat filename that won't create nested directories or contain illegal characters.

This follows the established pattern used by MCP servers: `mcpServer.${definition.id}` (see `src/vs/workbench/contrib/mcp/common/mcpServer.ts` line 426).

### Option B: Comprehensive Fix (Optional)

An alternative approach would be to add sanitization in `AbstractLoggerService.toResource()` itself, so that _any_ string ID is automatically made filesystem-safe:

```typescript
protected toResource(idOrResource: string | URI): URI {
    if (isString(idOrResource)) {
        const safeId = idOrResource.replace(/[^a-zA-Z0-9.-]/g, '_');
        return joinPath(this.logsHome, `${safeId}.log`);
    }
    return idOrResource;
}
```

**Trade-off:** This is broader and prevents similar issues from any future logger ID, but it changes behavior for all callers and could break existing logger lookups if IDs are used as keys elsewhere in the system. The targeted fix (Option A) is safer.

## Confidence Level: High

## Reasoning

1. The `DynamicAuthProvider` is the only code path that passes a URL string as a logger ID, while all other callers use simple alphanumeric IDs.
2. The PR title explicitly states "Fix illegal characters in Dynamic Auth Provider logger filename", confirming the issue is in the filename/ID used for the dynamic auth provider's logger.
3. The file `extHostAuthentication.ts` was newly introduced just before the parent commit, and the error was already being reported from millions of machines — the dynamic auth provider feature is widely activated since it handles OAuth2 authorization flows.
4. The fix transforms the URL-based ID into a filesystem-safe string, preventing the illegal characters from propagating through the URI handling chain.
5. The proposed change follows the established `prefix.id` pattern used by other loggers (e.g., `mcpServer.${id}`).
