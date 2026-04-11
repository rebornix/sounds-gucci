# Bug Analysis: Issue #304778

## Understanding the Bug
The Problems panel is surfacing prompt-validation warnings such as `Unknown tool 'vscode/memory'.` and `Unknown model 'Gemini 3 Flash (Preview) (copilot)'.` for agent prompt files under user/global storage. Those files are not part of the current workspace and, based on the report, were never explicitly opened by the user, so the Problems panel is showing background prompt-customization noise instead of project-local diagnostics.

## Git History Analysis
- The initial 24-hour history window before `6eee457e0cce931884eec375c0fe665f0d9f9a15` did not reveal any related churn in the prompt validator or Problems view code.
- Expanding to 3 days and then 7 days still did not show relevant changes in `src/vs/workbench/contrib/chat/common/promptSyntax/languageProviders`, `src/vs/workbench/contrib/markers/browser`, or nearby prompt-customization code.
- Blame on the marker-publication path in `src/vs/workbench/contrib/chat/common/promptSyntax/languageProviders/promptValidator.ts` shows the broad tracker behavior is older, not a same-week change.
- The key pre-fix behavior is in `PromptValidatorContribution.updateRegistration()`: it iterates `modelService.getModels()` and creates a `ModelTracker` for every prompt-language text model, and each tracker publishes markers through `markerService.changeOne(MARKERS_OWNER_ID, this.textModel.uri, markers)`.

### Time Window Used
- Initial: 24 hours
- Final: 168 hours (expanded 2 times)

## Root Cause
`PromptValidatorContribution` uses "prompt model exists in IModelService" as the condition for publishing Problems markers. That is too broad: background prompt models for user/global-storage customizations can exist without being opened in an editor, so their validation warnings are emitted into the global marker service and then picked up by the Problems panel.

## Proposed Fix

### Option A: Targeted Fix (Recommended)
**Affected Files:**
- `src/vs/workbench/contrib/chat/common/promptSyntax/languageProviders/promptValidator.ts`
- `src/vs/workbench/contrib/chat/test/browser/promptSyntax/languageProviders/promptValidator.test.ts` or a new contribution-level browser test alongside it

**Changes Required:**
Restrict prompt diagnostics to prompt files that are actually open in an editor.

1. Inject `IEditorService` into `PromptValidatorContribution`.
2. Replace the unconditional tracker creation over `modelService.getModels()` with a helper that only tracks prompt models whose resource is currently opened in an editor, for example via `editorService.findEditors(model.uri).length > 0`.
3. Add an `editorService.onDidEditorsChange` listener that resynchronizes trackers when editors open or close.
4. Reuse the same sync helper from `onModelAdded` and `onModelLanguageChanged` so the logic is correct regardless of whether the model appears before or after the editor input.
5. Keep disposal as-is. `ModelTracker.dispose()` already removes markers, so closing the last editor for a prompt file will automatically clear its stale Problems entries.

This keeps prompt validation available when a user intentionally opens a prompt file, while removing startup noise from hidden prompt models loaded in the background.

**Code Sketch:**
```ts
import { IEditorService } from '../../../../../services/editor/common/editorService.js';

export class PromptValidatorContribution extends Disposable {
        constructor(
                @IModelService private readonly modelService: IModelService,
                @IEditorService private readonly editorService: IEditorService,
                @IInstantiationService instantiationService: IInstantiationService,
                @IMarkerService private readonly markerService: IMarkerService,
                @IPromptsService private readonly promptsService: IPromptsService,
                @ILanguageModelsService private readonly languageModelsService: ILanguageModelsService,
                @ILanguageModelToolsService private readonly languageModelToolsService: ILanguageModelToolsService,
                @IChatModeService private readonly chatModeService: IChatModeService,
        ) {
                super();
                this.validator = instantiationService.createInstance(PromptValidator);
                this.updateRegistration();
        }

        private syncTrackers(trackers: ResourceMap<ModelTracker>): void {
                const openPromptUris = new ResourceSet();

                for (const model of this.modelService.getModels()) {
                        const promptType = getPromptsTypeForLanguageId(model.getLanguageId());
                        if (!promptType || this.editorService.findEditors(model.uri).length === 0) {
                                continue;
                        }

                        openPromptUris.add(model.uri);
                        if (!trackers.has(model.uri)) {
                                trackers.set(model.uri, new ModelTracker(model, promptType, this.validator, this.promptsService, this.markerService));
                        }
                }

                trackers.forEach((tracker, uri) => {
                        if (!openPromptUris.has(uri)) {
                                tracker.dispose();
                                trackers.delete(uri);
                        }
                });
        }

        updateRegistration(): void {
                this.localDisposables.clear();
                const trackers = new ResourceMap<ModelTracker>();
                this.localDisposables.add(toDisposable(() => {
                        trackers.forEach(tracker => tracker.dispose());
                        trackers.clear();
                }));

                this.syncTrackers(trackers);
                this.localDisposables.add(this.modelService.onModelAdded(() => this.syncTrackers(trackers)));
                this.localDisposables.add(this.modelService.onModelRemoved(model => {
                        const tracker = trackers.get(model.uri);
                        if (tracker) {
                                tracker.dispose();
                                trackers.delete(model.uri);
                        }
                }));
                this.localDisposables.add(this.modelService.onModelLanguageChanged(() => this.syncTrackers(trackers)));
                this.localDisposables.add(this.editorService.onDidEditorsChange(() => this.syncTrackers(trackers)));

                const validateAll = (): void => trackers.forEach(tracker => tracker.validate());
                this.localDisposables.add(this.languageModelToolsService.onDidChangeTools(validateAll));
                this.localDisposables.add(this.chatModeService.onDidChangeChatModes(validateAll));
                this.localDisposables.add(this.languageModelsService.onDidChangeLanguageModels(validateAll));
        }
}
```

**Regression Test:**
Add a contribution-level test that:

1. Creates a prompt-language model for a `*.agent.md` resource.
2. Stubs `IEditorService.findEditors(resource)` to return `[]` and verifies no markers are published for that resource.
3. Simulates opening the editor by returning a non-empty result and firing `onDidEditorsChange`, then verifies markers are created.
4. Simulates closing the last editor and verifies `MARKERS_OWNER_ID` markers for that resource are removed.

This directly covers the reported startup-noise scenario.

### Option B: Comprehensive Fix (Optional)
Special-case prompt-validation markers in the Problems view so resources outside the workspace are filtered out there.

**Trade-offs:**
- Broader and riskier because it changes generic Problems-view behavior.
- Hard-codes marker-owner/resource-policy knowledge into a shared markers UI instead of fixing the prompt subsystem that produced the noise.
- Still leaves prompt markers alive in the global marker service, which makes the behavior harder to reason about.

I would avoid this unless the product requirement is specifically "never show prompt diagnostics in Problems unless they are workspace resources," regardless of editor state.

## Confidence Level: High

## Reasoning
The symptom lines up directly with the pre-fix architecture:

- prompt validator warnings are emitted through the normal marker service,
- the Problems panel reads those markers globally,
- and the contribution currently creates trackers for every prompt model in memory rather than only for prompt files the user has opened.

Gating diagnostics on `editorService.findEditors(model.uri)` addresses the exact overreach that produces the issue. It is also a narrow fix: it leaves the validator itself unchanged, preserves diagnostics and quick fixes when a prompt file is actually opened, and relies on existing editor-service state instead of adding Problems-view special cases.