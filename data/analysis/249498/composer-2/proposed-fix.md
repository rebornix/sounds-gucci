# Bug Analysis: Issue #250423

## Understanding the Bug

The issue is a **UX/feature** request for MCP **resource templates** (RFC 6570 URI templates). When the user picks a templated resource (for example “repo context for PR” from the GitHub MCP server), **filling each placeholder is awkward**: the flow feels like a rough QuickPick / stepped input, hard to use day-to-day. Discussion points to:

- **QuickPick is a poor fit** for multi-variable template entry (maintainer consensus).
- A **stable editor surface** (Monaco) would be easier than transient pickers.
- The client should use a **normal completions path**: the MCP stack already has `completion/complete` for prompt/resource references; variable filling should surface **completions from the server** (including previously resolved variables) instead of one-off prompts with no IntelliSense.

At the **parent commit**, the workbench can list and attach **static** MCP resources via `McpAddContextContribution` / `McpResourcePickHelper`, but **`IMcpServer` does not expose resource templates**, even though `McpServerRequestHandler` already implements `listResourceTemplates` and `complete` in the protocol layer.

## Git History Analysis

Relevant prior work in `src/vs/workbench/contrib/mcp/` up to `8de6ad92ff16f1dac412be3de183f9c9fed23871`:

- **`mcp: allow attaching resources as chat context` (#249398)** — wired static resources into chat “Add Context”; establishes `McpResourcePickHelper` and attachment flow.
- **`mcp: initial wiring for resources`** — foundational resource listing.
- **`mcp: v1 support for mcp prompts` (#249139)** — parameterized prompts use a **sequential `InputBox` loop** per argument in `chatInputCompletions.ts` (`StartParameterizedPromptAction`); this pattern is informative as **anti-pattern** for resource templates: same “one field at a time” UX the issue rejects for templates.

No commits in the 7-day window before the parent were specific to **resource template UI**; the gap is **product wiring** (server API + editor/completions UX), not a small regression in existing template UI.

### Time Window Used

- Initial: 24 hours  
- Final: **7 days** (expanded to place MCP resource work in context; no template-specific commits found)

## Root Cause

1. **Missing product API**: `listResourceTemplates` exists on `McpServerRequestHandler` and `ResourceTemplate` exists in `modelContextProtocol.ts`, but **`IMcpServer` / `McpServer` only iterate static `resources()`** — templates never reach the workbench UI layer.
2. **Wrong interaction model (if implemented naively)**: mirroring **parameterized prompts** (sequential `InputBox` / QuickPick per variable) matches the “very rough” complaint. The protocol already supports **`completion/complete`** for resource references; the UI should **not** ignore that and force linear pickers.
3. **No Monaco/completions integration**: the issue explicitly asks to **“use a normal completions provider”** so server-provided suggestions appear **while editing** the template URI, not after each isolated step.

## Proposed Fix

### Option A: Targeted Fix (Recommended)

**Affected files (conceptual):**

- `src/vs/workbench/contrib/mcp/common/mcpTypes.ts` — extend `IMcpServer` with something like `resourceTemplates(token?)` returning `MCP.ResourceTemplate[]` (or async iterable mirroring `resources()`).
- `src/vs/workbench/contrib/mcp/common/mcpServer.ts` — implement by calling `callOn` + `handler.listResourceTemplates` (same pattern as `resources()` / `listResourcesIterable`).
- `src/vs/workbench/contrib/mcp/browser/mcpResourceQuickAccess.ts` and/or `mcpAddContextContribution.ts` — include **resource templates** in the same “MCP Resources…” picker (grouped under servers), not only static resources.
- **New small module** (e.g. `mcpResourceTemplateEditor.ts` or contribution method on a helper) — when the user selects a template:
  1. Parse the **RFC 6570** `uriTemplate` to discover variable names (minimal parser or shared URI-template utility).
  2. Open a **single** modal or editor host with **Monaco** showing the full template string (or a dedicated buffer with the template as starting text).
  3. Register a **scoped `CompletionItemProvider`** (or wire through existing chat/editor completion infrastructure) that calls `McpServerRequestHandler.complete()` with `params.ref` set to a **resource template reference** per MCP spec (`ResourceReference`) and `params.argument` `{ name, value }` for the variable at the caret, passing **already-filled** variable values from the buffer so the server can narrow suggestions (per thread with @connor4312).
  4. On accept, **expand** the template to a concrete URI string, then **`readResource`** and reuse existing **`toAttachment` / attachment** path.

**`McpResourcePickHelper.hasServersWithResources`** (or a sibling observable) should treat servers that expose **templates** (and `McpCapability.Resources`) so the menu appears when only templates exist.

**Code sketch (illustrative):**

```ts
// IMcpServer - mirror resources()
resourceTemplates(token?: CancellationToken): AsyncIterable<MCP.ResourceTemplate[]>;

// McpServer.resourceTemplates - inside callOn(handler => ...)
for await (const page of handler.listResourceTemplatesIterable({}, token)) {
  emitter.emitOne(page);
}

// Monaco completion provider (conceptual)
provideCompletionItems(model, position) {
  const { ref, argumentName, partialValue } = mapPositionToTemplateArgument(model, position);
  return server.connection.get()!.handler.complete({
    ref: { type: 'resource', uri: templateUriOrRef }, // per MCP ResourceReference shape
    argument: { name: argumentName, value: partialValue },
  }, token).then(r => r.completion.values.map(v => ({ label: v, insertText: v })));
}
```

(Exact `ResourceReference` shape must match `modelContextProtocol.ts` at this revision.)

### Option B: Comprehensive Fix (Optional)

- **Workspace-aware defaults**: pre-fill variables from the active workspace (repo, branch, open file) before opening completions — addresses @isidorn’s suggestion; can be layered on Option A.
- **Unify** parameterized **prompt** argument collection with the same Monaco + `completion/complete` path for consistency (larger scope).

## Confidence Level: Medium

## Reasoning

The issue and maintainer thread converge on **editor + completions**, not sequential QuickPick. The codebase at the parent commit already has **handler support** for templates and completions, and **chat already demonstrates** the weaker sequential input pattern for prompts — resource templates should **deliberately diverge** from that. Exposing `resourceTemplates` on `IMcpServer` and integrating Monaco-backed `completion/complete` directly addresses the described pain and matches the protocol design.
