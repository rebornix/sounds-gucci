# Fix Validation: PR #249498

## Actual Fix Summary

The PR wires **MCP resource templates** into the workbench: `IMcpServer.resourceTemplates()` lists templates from `listResourceTemplates`, introduces `IMcpResourceTemplate` with `complete()` (delegating to `McpServerRequestHandler.complete` for resource refs) and `resolveURI()` via a new **RFC 6570** `UriTemplate` implementation (`uriTemplate.ts` + tests). The resource picker merges static resources and templates; choosing a template runs a **per-variable QuickPick** whose value updates trigger **debounced server completions** (`RunOnceScheduler`, 300ms). `toAttachment` / quick access handle templates, optional `undefined` on cancel (`CancellationError` in add-context), and `toURI` for opening resolved URIs in the editor. `IMcpPrompt.complete()` was also added for symmetry.

### Files Changed

- `src/vs/workbench/contrib/mcp/browser/mcpAddContextContribution.ts` — treat `toAttachment` returning undefined as cancel (`CancellationError`).
- `src/vs/workbench/contrib/mcp/browser/mcpResourceQuickAccess.ts` — templates in picks, `McpResourcePickHelper` supports `IMcpResource | IMcpResourceTemplate`, template → URI/attachment via QuickPick + `complete`, parallel resource + template fetch, connection error handling tweaks.
- `src/vs/workbench/contrib/mcp/common/mcpServer.ts` — `resourceTemplates()`, `McpResourceTemplate` class, `McpPrompt.complete()`.
- `src/vs/workbench/contrib/mcp/common/mcpTypes.ts` — `IMcpResourceTemplate`, `resourceTemplates()` on `IMcpServer`, type guards, `IMcpPrompt.complete()`.
- `src/vs/workbench/contrib/mcp/common/uriTemplate.ts` — **new** URI template parse/resolve.
- `src/vs/workbench/contrib/mcp/test/common/uriTemplate.test.ts` — **new** tests.

### Approach

Expose templates on the server API, parse templates with a dedicated `UriTemplate` helper, surface templates in the same MCP resource UX, and collect variable values using **QuickInput** with **MCP `completion/complete`** for suggestions—not a Monaco buffer with a completion provider.

## Proposal Comparison

### Files Overlap

| Proposal | Actual | Match |
|----------|--------|-------|
| `mcpTypes.ts` | `mcpTypes.ts` | ✅ |
| `mcpServer.ts` | `mcpServer.ts` | ✅ |
| `mcpResourceQuickAccess.ts` | `mcpResourceQuickAccess.ts` | ✅ |
| `mcpAddContextContribution.ts` | `mcpAddContextContribution.ts` | ✅ (proposal listed; actual change is smaller—cancellation) |
| New module for template/editor (conceptual) | `uriTemplate.ts` + tests | ⚠️ (proposal framed as Monaco host; actual is RFC 6570 engine + QuickPick flow) |

**Overlap Score:** 4/5 core conceptual files strongly aligned; the “new module” matches `uriTemplate` in spirit (template handling) but not the proposed Monaco surface.

### Root Cause Analysis

- **Proposal's root cause:** Missing `resourceTemplates` on `IMcpServer` / workbench; templates never reach UI; fix should use **`completion/complete`** instead of ignoring it; avoid naive sequential InputBox-only flow; integrate completions while editing.
- **Actual root cause:** Same API gap (`listResourceTemplates` not exposed on `IMcpServer`); templates merged into picker; variable filling uses QuickPick with **live `complete()`** calls and `UriTemplate` resolution.
- **Assessment:** ✅ **Correct** on protocol/API gap and on using server completions for template variables. The issue’s preference for a **stable editor (Monaco)** is **not** how the PR implemented collection UI.

### Approach Comparison

- **Proposal's approach:** Extend `IMcpServer`, implement in `McpServer`, add templates to picker, then **Monaco** (or dedicated buffer) + **scoped `CompletionItemProvider`** calling `handler.complete` while editing the full template string.
- **Actual approach:** Same server/types/picker wiring; **sequential QuickPick per variable** with debounced `complete()` and pick items built from suggestions; new **`UriTemplate`** for parse/resolve (no Monaco completion provider for the template string).
- **Assessment:** Same **data plane** (templates + `complete`); **different presentation** (QuickPick + debounce vs Monaco + completions-as-you-type). Both address “use completions from the server”; the shipped fix is closer to the old stepped flow than the proposal’s editor-centric UX.

## Alignment Score: 4/5 (Good)

## Detailed Feedback

### What the proposal got right

- Identified the **missing `IMcpServer` / `McpServer` surface** for resource templates and the need to call into `listResourceTemplates`.
- Pointed at **`mcpTypes.ts`**, **`mcpServer.ts`**, **`mcpResourceQuickAccess.ts`**, and **`mcpAddContextContribution.ts`** as the right integration points.
- Correctly emphasized **`completion/complete`** for template variables and **RFC 6570** awareness (parse variables / expand URI).
- Recognized **`McpResourcePickHelper` / “has resources”** semantics should account for servers that only have templates.

### What the proposal missed

- Did not predict the **standalone `uriTemplate.ts`** module with full RFC 6570 resolution tests (proposal only sketched “minimal parser”).
- No mention of **`CancellationError`** when attachment is cancelled, or **`toURI`** for “open resource” vs static `resource.uri`.
- Did not mention **`IMcpPrompt.complete()`** added in the same PR.

### What the proposal got wrong

- **Primary UX:** The proposal recommended **Monaco + completion provider** and treating sequential QuickPick as the problem; the actual fix **kept QuickPick** but wired **server completions into it** (plus `UriTemplate` for resolution). That is a meaningful divergence from the proposal’s headline UI.

## Recommendations for Improvement

- After confirming handler support, enumerate **concrete UI patterns already in the repo** (e.g. other QuickInput + async completion usages) rather than defaulting to Monaco when the team may ship a smaller incremental UX.
- Note that **shipping** may still use stepped input if each step is **completion-backed**, satisfying “completions path” without a full editor surface.
