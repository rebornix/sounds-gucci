# Bug Analysis: Issue #272479

## Understanding the Bug

The bug is specific to the `source.addMissingImports` source action path. The reporter says the normal light bulb quick fix respects `typescript.preferences.preferTypeOnlyAutoImports: false`, but invoking the add-missing-imports source action through a custom keybinding always inserts `type` imports.

That strongly suggests the setting itself is being read correctly, but one code-action path is not sending the right preferences to tsserver before asking it to compute the import edits.

## Git History Analysis

- The 24-hour window before parent commit `6648ece501f958a8fcf9092583e7541818992258` only contained an unrelated prompt-files commit (`#304872`).
- The 3-day and 7-day path-scoped history for `extensions/typescript-language-features` contained no commits, so there is no obvious recent regression in the TypeScript extension itself.
- Existing code in `updatePathsOnRename.ts` already calls `fileConfigurationManager.setGlobalConfigurationFromDocument(...)` before asking tsserver for a multi-edit response (`getEditsForFileRename`), which is a strong precedent for how global preference-sensitive operations are supposed to be prepared.

### Time Window Used

- Initial: 24 hours
- Final: 168 hours (expanded 2 times)

## Root Cause

`SourceAddMissingImports` in `extensions/typescript-language-features/src/languageFeatures/fixAll.ts` ultimately uses `getCombinedCodeFix`, but the provider only calls `ensureConfigurationForDocument(document, token)` first. That helper sends file-scoped configuration, while the combined code-fix path appears to rely on tsserver's global user-preference state.

As a result, `preferTypeOnlyAutoImports` is not refreshed for the source action path, so tsserver falls back to stale or default global preferences and keeps generating `import type` edits. The normal light bulb quick fix behaves correctly because it uses the direct `getCodeFixes` result rather than the combined-fix path.

## Proposed Fix

### Option A: Targeted Fix (Recommended)

**Affected Files:**
- `extensions/typescript-language-features/src/languageFeatures/fixAll.ts`

**Changes Required:**

Before building the `source.addMissingImports` action, send the current document's preferences to tsserver as a global configuration as well as a file-scoped configuration.

The smallest change is to call `fileConfigurationManager.setGlobalConfigurationFromDocument(document, token)` in `provideCodeActions` after `ensureConfigurationForDocument(...)` and before `action.build(...)` runs. If the team wants the narrowest possible fix, this can be gated so it only runs when `context.only` intersects `SourceAddMissingImports.kind`.

**Code Sketch:**

```ts
await this.fileConfigurationManager.ensureConfigurationForDocument(document, token);
await this.fileConfigurationManager.setGlobalConfigurationFromDocument(document, token);

if (token.isCancellationRequested) {
	return undefined;
}

await Promise.all(actions.map(action => action.build(this.client, file, diagnostics, token)));
```

Why this is the minimal fix:
- It keeps the behavior local to the `source.addMissingImports` provider.
- It matches the existing pattern already used before another tsserver operation that produces multi-file or combined edits.
- It does not require changing how the preference is parsed.

### Option B: Comprehensive Fix (Optional)

**Affected Files:**
- `extensions/typescript-language-features/src/languageFeatures/fixAll.ts`
- `extensions/typescript-language-features/src/languageFeatures/fileConfigurationManager.ts`
- potentially `extensions/typescript-language-features/src/languageFeatures/quickFix.ts`

**Changes Required:**

Introduce a helper dedicated to pushing user preferences even when there is no visible editor, and use it before any tsserver request that resolves combined/global edits such as `getCombinedCodeFix` and `getEditsForFileRename`.

This broader version addresses the same root cause more systematically:
- `FileConfigurationManager.getFormattingOptions(...)` currently returns `undefined` when the document is not in `visibleTextEditors`.
- That means any future or background code-action path that needs global preferences can silently skip configuration entirely.
- A preferences-only helper, or a fallback that derives formatting defaults from workspace settings, would make these global tsserver requests deterministic.

## Confidence Level: Medium

## Reasoning

- `preferTypeOnlyAutoImports` is definitely wired into `FileConfigurationManager.getPreferences(...)`, so the setting is not missing.
- `fixAll.ts` uses `getCombinedCodeFix` for `source.addMissingImports`, which is the key difference from the working light bulb quick fix path.
- `updatePathsOnRename.ts` explicitly sends global configuration before another tsserver operation that computes edits outside a simple per-file request, which is the closest in-repo precedent.
- The issue's behavior split lines up with the code split: one path is direct/file-scoped and works, the other is combined/global and does not.
- I did not run the extension in a live VS Code session, so the exact placement should still be validated against the reporter's custom-keybinding workflow.