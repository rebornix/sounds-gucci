# Fix Validation: PR #304872

## Actual Fix Summary
The actual PR moved prompt-validation tracking into a browser-specific contribution and changed it to validate only prompt models that are open in code editors, which prevents background Copilot prompt files in user/global storage from contributing markers to the Problems view.

### Files Changed
- `src/vs/workbench/contrib/chat/browser/chat.contribution.ts` - Updated the import so the prompt language features provider is loaded from the new browser-specific module.
- `src/vs/workbench/contrib/chat/browser/promptSyntax/promptFileContributions.ts` - Added a new browser-side prompt language features provider and a new `PromptValidatorContribution` that tracks open code editors, reference-counts models, and removes markers when the last editor closes.
- `src/vs/workbench/contrib/chat/common/promptSyntax/languageProviders/promptValidator.ts` - Removed the old model-service-based `PromptValidatorContribution` and left only the shared validator logic and marker generation helpers.
- `src/vs/workbench/contrib/chat/common/promptSyntax/promptFileContributions.ts` - Deleted the old common contribution file because the workbench contribution now lives in the browser layer.

### Approach
The fix changes the gating condition from “any prompt text model exists” to “a prompt text model is currently open in a code editor.” To make that possible, the PR moves the contribution into the browser layer, uses `ICodeEditorService` instead of `IModelService`, tracks editor add/remove and model/language changes, and disposes trackers so stale prompt markers disappear when editors close.

## Proposal Comparison

### Files Overlap
| Proposal | Actual | Match |
|----------|--------|-------|
| `src/vs/workbench/contrib/chat/common/promptSyntax/languageProviders/promptValidator.ts` | `src/vs/workbench/contrib/chat/common/promptSyntax/languageProviders/promptValidator.ts` | ✅ |
| `src/vs/workbench/contrib/chat/test/browser/promptSyntax/languageProviders/promptValidator.test.ts` or new test | - | ❌ (extra) |
| - | `src/vs/workbench/contrib/chat/browser/chat.contribution.ts` | ❌ (missed) |
| - | `src/vs/workbench/contrib/chat/browser/promptSyntax/promptFileContributions.ts` | ❌ (missed) |
| - | `src/vs/workbench/contrib/chat/common/promptSyntax/promptFileContributions.ts` | ❌ (missed) |

**Overlap Score:** 1/4 actual files matched directly (25%)

### Root Cause Analysis
- **Proposal's root cause:** Prompt diagnostics were published for every prompt-language model in memory, including background user/global-storage prompt files that were never intentionally opened.
- **Actual root cause:** The old contribution created validators from `IModelService` for all prompt models, so hidden prompt files could publish markers into the global marker service and leak into the Problems panel.
- **Assessment:** ✅ Correct

### Approach Comparison
- **Proposal's approach:** Keep the existing contribution structure, inject an editor service, and only create trackers for prompt models that have an open editor; resync on editor open/close events.
- **Actual approach:** Move the contribution to a browser-specific module, use `ICodeEditorService`, and track actual code editors with per-editor listeners and model reference counting so markers exist only while at least one editor is open.
- **Assessment:** Very similar fix direction. The actual PR is more invasive because it relocates the contribution into the browser layer and uses editor-level tracking instead of a simpler model sync helper, but both approaches target the same condition and would address the reported problem.

## Alignment Score: 4/5 (Good)

## Detailed Feedback

### What the proposal got right
- It identified the correct root cause: prompt markers were being created for background models rather than only for prompt files the user had actually opened.
- It proposed the correct product behavior: only show prompt diagnostics for files open in an editor.
- It recognized that tracker disposal should clear stale Problems entries when editors close.

### What the proposal missed
- The actual fix had to move `PromptValidatorContribution` out of the common layer into a browser-specific contribution because editor tracking depends on browser/editor services.
- The PR updated the contribution wiring in `chat.contribution.ts` and replaced the old common `promptFileContributions.ts` file entirely.
- The actual implementation tracks concrete code editor instances and model swaps with reference counting, which is more precise than the proposal’s simpler `findEditors`-based sync.

### What the proposal got wrong
- It assumed the change could stay entirely inside `promptValidator.ts`; in the real codebase, that would have violated layer boundaries once browser services were needed.
- It expected a regression test in this PR, but the actual fix shipped without adding one.

## Recommendations for Improvement
Checking architectural boundaries earlier would have helped: once the proposed fix needed editor-open state, the analyzer should have considered whether the contribution belonged in a browser-specific module instead of the common prompt validator file.