# Bug Analysis: Issue #250423

## Understanding the Bug

Issue #250423 reports that MCP resource templates have a very rough, unusable UI. When using an MCP server (e.g., GitHub MCP server) that provides resource templates — URI templates per RFC 6570 with placeholder variables — the user experience for filling in those placeholders is poor or entirely absent.

At the current state of the codebase (parent commit `8de6ad9`):

1. **The MCP protocol layer supports resource templates**: `McpServerRequestHandler.listResourceTemplates()` exists and can call `resources/templates/list` on MCP servers.
2. **The MCP completion API exists**: `McpServerRequestHandler.complete()` can call `completion/complete` to get suggestions for template variables.
3. **But the `IMcpServer` interface does NOT expose resource templates**: The `resources()` method only calls `listResourcesIterable()` for static resources. There is no `resourceTemplates()` method.
4. **The UI only shows static resources**: `McpResourcePickHelper.getPicks()` and `McpAddContextContribution` enumerate static resources only — templates are invisible to users.
5. **There is no URI template parser**: No code exists to parse RFC 6570 URI templates, extract variable names, or expand templates with provided values.

The result is that any MCP server that provides resource templates (like GitHub MCP server's "repo context for PR" template) cannot be used through the VS Code UI.

## Git History Analysis

### Relevant Commits

| Commit | Description | Relevance |
|--------|-------------|-----------|
| `334cbd5b2de` | mcp: allow attaching resources as chat context (#249398) | Parent PR this builds on; added `McpResourcePickHelper`, `McpAddContextContribution`, resource filesystem, static resource listing |
| `608e9a055c8` | mcp: initial wiring for resources | Foundation: `McpResourceFilesystem`, `mcp-resource` URI scheme, `resources()` on server |
| `7b2e3090b79` | fix: use markdown string for MCP tool confirmation | Unrelated |
| `2e59a779912` | Add support for tool sets | Unrelated |

### Time Window Used
- Initial: 24 hours
- Final: 7 days (expanded to capture the parent PR and initial resource wiring)

## Root Cause

The root cause is a **missing feature**: MCP resource templates are defined in the protocol layer but not surfaced through the server abstraction or the UI. Specifically:

1. No URI template parsing exists to extract variables from RFC 6570 templates.
2. `IMcpServer` has no method to list resource templates.
3. The resource picker UI has no flow for selecting a template, filling in its variables (potentially with completions from the server), and resolving the resulting resource.

## Proposed Fix

### Option A: Targeted Fix (Recommended)

**Affected Files:**
- `src/vs/workbench/contrib/mcp/common/uriTemplate.ts` (NEW)
- `src/vs/workbench/contrib/mcp/common/mcpTypes.ts`
- `src/vs/workbench/contrib/mcp/common/mcpServer.ts`
- `src/vs/workbench/contrib/mcp/browser/mcpResourceQuickAccess.ts`
- `src/vs/workbench/contrib/mcp/browser/mcpAddContextContribution.ts`

**Changes Required:**

#### 1. Create URI template parser (`uriTemplate.ts`)

A new utility that implements RFC 6570 Level 1-2 URI template parsing:

- **Parse**: Extract variable names from a URI template string (e.g., `https://github.com/{owner}/{repo}/pull/{number}` → `['owner', 'repo', 'number']`)
- **Expand**: Given a map of variable→value, produce the final URI string
- Support basic expression types: simple string expansion (`{var}`), reserved expansion (`{+var}`), and fragment expansion (`{#var}`)

```typescript
// src/vs/workbench/contrib/mcp/common/uriTemplate.ts

export interface UriTemplateVariable {
  name: string;
}

export class UriTemplate {
  readonly variables: readonly UriTemplateVariable[];

  constructor(readonly template: string) {
    this.variables = this._parseVariables();
  }

  private _parseVariables(): UriTemplateVariable[] {
    const vars: UriTemplateVariable[] = [];
    const regex = /\{([+#./;?&]?)([^}]+)\}/g;
    let match;
    while ((match = regex.exec(this.template)) !== null) {
      const varList = match[2].split(',');
      for (const v of varList) {
        const name = v.replace(/:[0-9]+|\*$/, ''); // strip prefix length and explode modifier
        if (!vars.some(existing => existing.name === name)) {
          vars.push({ name });
        }
      }
    }
    return vars;
  }

  expand(values: Record<string, string>): string {
    return this.template.replace(/\{([+#./;?&]?)([^}]+)\}/g, (_match, operator, varList) => {
      const parts = varList.split(',').map((v: string) => {
        const name = v.replace(/:[0-9]+|\*$/, '');
        const value = values[name] ?? '';
        if (operator === '+' || operator === '#') {
          return value; // reserved/fragment: don't encode
        }
        return encodeURIComponent(value);
      });
      const joined = parts.join(',');
      return operator === '#' ? '#' + joined : joined;
    });
  }
}
```

#### 2. Add resource template types to `mcpTypes.ts`

```typescript
/**
 * A representation of an MCP resource template.
 */
export interface IMcpResourceTemplate {
  readonly uriTemplate: string;
  readonly name: string;
  readonly description?: string;
  readonly mimeType?: string;
}
```

Also add a `resourceTemplates()` method to the `IMcpServer` interface:

```typescript
/**
 * Lists all resource templates on the server.
 */
resourceTemplates(token?: CancellationToken): AsyncIterable<IMcpResourceTemplate[]>;
```

#### 3. Add `resourceTemplates()` method to `McpServer` class in `mcpServer.ts`

```typescript
public resourceTemplates(token?: CancellationToken): AsyncIterable<IMcpResourceTemplate[]> {
  const cts = new CancellationTokenSource(token);
  return new AsyncIterableObject<IMcpResourceTemplate[]>(async emitter => {
    await McpServer.callOn(this, async (handler) => {
      const templates = await handler.listResourceTemplates({}, cts.token);
      emitter.emitOne(templates.map(t => ({
        uriTemplate: t.uriTemplate,
        name: t.name,
        description: t.description,
        mimeType: t.mimeType,
      })));
    });
  }, () => cts.dispose(true));
}
```

Also add a `complete()` method (or expose the handler's complete) so the UI can request completions for template variables:

```typescript
public complete(params: MCP.CompleteRequest['params'], token?: CancellationToken): Promise<MCP.CompleteResult> {
  return McpServer.callOn(this, h => h.complete(params, token), token);
}
```

#### 4. Update `mcpResourceQuickAccess.ts` — resource picker with template support

The key changes to `McpResourcePickHelper`:

- **`getPicks()`**: Alongside static resources, also enumerate `resourceTemplates()` from each server that has the Resources capability.
- **Template items**: Show templates as distinct pick items (with a template icon or descriptor) that, when selected, open a multi-step flow.
- **Template variable filling flow**: When a template is selected:
  1. Parse the URI template using `UriTemplate` to get variable names.
  2. For each variable, show a QuickInput asking the user to enter a value.
  3. Use the MCP `completion/complete` API to provide suggestions/autocomplete for each variable, passing previously-resolved variables as context.
  4. After all variables are filled, expand the template to get the final resource URI.
  5. Create the resource attachment from the resolved URI.

```typescript
// In McpResourcePickHelper or a new helper

private async _resolveTemplate(
  server: IMcpServer,
  template: IMcpResourceTemplate,
  quickInputService: IQuickInputService,
  token: CancellationToken,
): Promise<IMcpResource | undefined> {
  const parsed = new UriTemplate(template.uriTemplate);
  const values: Record<string, string> = {};

  for (const variable of parsed.variables) {
    // Get completions from the MCP server
    const completionResult = await server.complete({
      ref: { type: 'ref/resource', uri: template.uriTemplate },
      argument: { name: variable.name, value: '' },
    }, token);

    const input = await quickInputService.input({
      prompt: variable.name,
      placeHolder: `Enter value for ${variable.name}`,
      // Show completion suggestions if available
    });

    if (input === undefined) {
      return undefined; // user cancelled
    }
    values[variable.name] = input;
  }

  const resolvedUri = parsed.expand(values);

  // Return as an IMcpResource
  const uri = McpResourceURI.fromServer(server.definition, resolvedUri);
  return {
    uri,
    mcpUri: resolvedUri,
    name: template.name,
    description: template.description,
    mimeType: template.mimeType,
    sizeInBytes: undefined,
  };
}
```

For the quick access provider (`McpResourceQuickAccess`), templates should be shown as items that, when accepted, trigger the multi-step variable input flow before resolving the resource.

#### 5. Update `mcpAddContextContribution.ts`

Include resource templates in the "MCP Resources..." context picker:

```typescript
private _getResourcePicks(token: CancellationToken) {
  // ... existing code for static resources ...
  // Additionally enumerate templates:
  // For each server with Resources capability, list templates
  // Show them as pick items with a "template" indicator
  // When selected, trigger the template resolution flow
}
```

### Option B: Comprehensive Fix — Snippet/Editor-Based Template Filling

As discussed in the issue comments, a more polished approach would use a Monaco editor with snippet-like inline editing for filling template variables, instead of sequential QuickInput prompts. This would:

- Show the full URI template with tab-stop-like placeholders
- Allow users to tab between variables
- Inline completions from the MCP server as suggestions
- Preview the resolved URI in real-time

This approach would be significantly more complex and would require:
- A custom editor widget or modification of the existing QuickPick input to use a Monaco editor
- A completions provider wired to the MCP completion API
- Snippet-like tab stop navigation logic

**Trade-off**: Much better UX (as @jrieken suggests in the issue) but significantly more implementation effort. The QuickInput approach in Option A gets the feature working first and can be improved later.

## Confidence Level: Medium

## Reasoning

1. **The protocol support is already in place**: `listResourceTemplates()` and `complete()` exist in the request handler. The gap is entirely in the server abstraction and the UI layer.

2. **The pattern is established**: The existing `resources()` method and `McpResourcePickHelper` provide a clear template (no pun intended) for how to enumerate and present server-provided items.

3. **URI template parsing is well-defined**: RFC 6570 is a stable spec with clear parsing rules. A basic Level 1-2 parser covers the common cases for MCP resource templates.

4. **Confidence is Medium** because:
   - The exact UX choices (QuickInput vs. editor-based) significantly affect the implementation details
   - The MCP completion integration requires careful handling of the completion context (passing previously-resolved variables)
   - The issue was created *after* this PR was merged, so this is more of a feature implementation analysis than a bug fix
   - The interaction between template resolution and the async iterable pattern used for picks needs careful design

5. **Validation**: If the proposed changes are applied:
   - Resource templates will appear in the "MCP Resources..." add-context menu and the quick access provider
   - Users can select a template, fill in variables with completion suggestions, and attach the resolved resource
   - The workflow described in the issue (selecting "repo context for PR" from GH MCP server) would become possible
