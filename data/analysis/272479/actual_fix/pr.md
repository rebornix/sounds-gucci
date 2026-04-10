# PR #304987: fix: send user preferences to TS server even without visible editor

**Repository:** microsoft/vscode
**Labels:** 
**Merge Commit:** `abdf722266f3d65b8d50c2cbd77421c7db5e95ec`
**Parent Commit:** `6648ece501f958a8fcf9092583e7541818992258`

## Description

## What kind of change does this PR introduce?

Bug fix

## What is the current behavior?

When `source.addMissingImports` code action is triggered, it calls `ensureConfigurationForDocument` to send the user's preferences to the TypeScript server. However, this method calls `getFormattingOptions(document)` which looks for a visible text editor matching the document. If no visible editor is found (which can happen when the code action is triggered via keybinding or command palette), the method returns `undefined` and `ensureConfigurationForDocument` **returns early without sending any configuration to the TS server**.

This means user preferences like `preferTypeOnlyAutoImports` are never communicated to the TypeScript server, causing it to use its default behavior instead. Users report that `source.addMissingImports` always adds `type` keyword to imports regardless of their `preferTypeOnlyAutoImports: false` setting, while the quick fix lightbulb (which goes through a different code path) works correctly.

Closes #272479

## What is the new behavior?

When no visible editor is found for the document, the method now falls back to `{ tabSize: undefined, insertSpaces: undefined }` instead of returning early. This means the formatting options will be unset (letting the TS server use its own defaults for tab size and spaces), but critically, all user preferences (including `preferTypeOnlyAutoImports`, `quotePreference`, `importModuleSpecifierPreference`, etc.) will still be sent to the TS server.

## Additional context

The fix is minimal: replace the conditional guard with a nullish coalescing fallback:

```typescript
// Before
const formattingOptions = this.getFormattingOptions(document);
if (formattingOptions) {
    return this.ensureConfigurationOptions(document, formattingOptions, token);
}

// After
const formattingOptions = this.getFormattingOptions(document)
    ?? { tabSize: undefined, insertSpaces: undefined };
return this.ensureConfigurationOptions(document, formattingOptions, token);
```

The `tabSize: undefined` and `insertSpaces: undefined` values are already valid for the `FormattingOptions` interface and the TS server's `configure` command handles them gracefully by using its own defaults.

## Commits

- fix: send user preferences to TS server even without visible editor

## Changed Files

- extensions/typescript-language-features/src/languageFeatures/fileConfigurationManager.ts
