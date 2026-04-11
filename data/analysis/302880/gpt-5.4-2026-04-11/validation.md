# Fix Validation: PR #304872

## Actual Fix Summary
The actual PR stopped prompt-validation markers from being created for background and user-scoped prompt models that were not open in editors. It moved the prompt language-features contribution into the browser layer and rewrote the prompt validator contribution to track only prompt models attached to open code editors, clearing markers when those editors close.

### Files Changed
- `src/vs/workbench/contrib/chat/browser/chat.contribution.ts` - switched the `PromptLanguageFeaturesProvider` import to a new browser-side module.
- `src/vs/workbench/contrib/chat/browser/promptSyntax/promptFileContributions.ts` - added a browser contribution that registers prompt language features and an editor-scoped prompt validator contribution.
- `src/vs/workbench/contrib/chat/common/promptSyntax/languageProviders/promptValidator.ts` - removed the old model-service-wide validator contribution and kept the validator logic itself.
- `src/vs/workbench/contrib/chat/common/promptSyntax/promptFileContributions.ts` - deleted the old common contribution file after moving the contribution to the browser layer.

### Approach
Instead of filtering the Problems view, the PR prevents the unwanted markers from existing unless the prompt file is currently open in a code editor. The new contribution watches code-editor add, remove, model-change, and language-change events, maintains ref-counted trackers per open prompt model, revalidates when tools, chat modes, or language models change, and removes markers when a model is no longer open.

## Proposal Comparison

### Files Overlap
| Proposal | Actual | Match |
|----------|--------|-------|
| `src/vs/workbench/contrib/markers/browser/markersView.ts` | - | ❌ (extra) |
| `src/vs/workbench/contrib/markers/test/browser/` | - | ❌ (extra) |
| - | `src/vs/workbench/contrib/chat/browser/chat.contribution.ts` | ❌ (missed) |
| - | `src/vs/workbench/contrib/chat/browser/promptSyntax/promptFileContributions.ts` | ❌ (missed) |
| - | `src/vs/workbench/contrib/chat/common/promptSyntax/languageProviders/promptValidator.ts` | ❌ (missed) |
| - | `src/vs/workbench/contrib/chat/common/promptSyntax/promptFileContributions.ts` | ❌ (missed) |

**Overlap Score:** 0/4 files (0%)

### Root Cause Analysis
- **Proposal's root cause:** The Problems view was aggregating markers for non-workspace prompt files and needed to restrict non-workspace diagnostics to resources currently open in editors.
- **Actual root cause:** The prompt validator contribution was creating markers for every prompt text model known to `IModelService`, including user and global prompt files that were not open in editors, so those markers legitimately flowed into Problems.
- **Assessment:** ⚠️ Partially Correct

### Approach Comparison
- **Proposal's approach:** Add resource filtering in `markersView.ts`, track open editor resources, and refresh or reset the Problems widget when editor membership changes.
- **Actual approach:** Limit marker creation at the source by moving prompt-file contributions to the browser and validating only prompt models that are open in code editors.
- **Assessment:** Different implementation layer but the same product-behavior goal. The proposal likely would have mitigated the symptom, but it targeted a broader UI aggregation path instead of the prompt-validation lifecycle that the PR actually fixed.

## Alignment Score: 3/5 (Partial)

## Detailed Feedback

### What the proposal got right
- It correctly identified the desired behavior: prompt-file problems should only appear when the file is open in an editor.
- It correctly treated the prompt-validator diagnostics as real findings rather than suggesting they be globally suppressed.
- It recognized that user and global prompt files, not workspace files, were the source of the leaked diagnostics.

### What the proposal missed
- The actual fix lives entirely in chat prompt contribution and validator-registration code, not in the generic Problems view.
- The bug source was marker production for all prompt models via `IModelService`, which required editor-lifecycle tracking and marker cleanup when editors close.
- The PR also needed to move the contribution from a common module to a browser module so it could depend on `ICodeEditorService`.

### What the proposal got wrong
- It located the root bug in `markersView.ts`, but the shipped fix showed the real defect was earlier in the pipeline.
- It proposed incremental update and reset handling in the Problems view, which turned out to be unnecessary for the actual bug path.
- It expected a markers-view test change, while the real patch changed prompt contributions and validator wiring instead.

## Recommendations for Improvement
Trace where the problematic markers are created before assuming the Problems panel is at fault. For prompt-file issues, following the contribution lifecycle from model and editor tracking into `IMarkerService` would have surfaced that the leaked diagnostics were generated too early, and that the cleanest fix was to gate validation to models that are actually open in editors.