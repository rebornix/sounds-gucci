# Bug Analysis: Issue #302880

## Understanding the Bug

Users are seeing prompt-validation warnings from Copilot agent configuration files in the global Problems panel, even when those files live outside the current workspace and were never opened. The reported diagnostics are real prompt-validator warnings such as `Unknown tool 'github/issue_read'.` and `Unknown model 'Gemini 3 Flash (Preview) (copilot)'.`, but they come from user-data / global-storage prompt files rather than from project files.

Two details from the issue comments matter:

- Maintainers explicitly split this into two concerns: built-in agents should avoid referencing optional tools, and the Problems view should only surface these diagnostics when the file is actually open in an editor.
- Multiple reporters saw duplicate entries under different URI schemes (`file:///...` and `vscode-userdata://...`), which is consistent with the Problems view aggregating all markers for those external resources instead of scoping them.

## Git History Analysis

- `45d5d7cd4cb` - `Fix: Problems table mode ignoring "Show Active File Only" filter (#291860)`
  This is the strongest signal. It shows `src/vs/workbench/contrib/markers/browser/markersView.ts` already has editor-scoped filtering logic, and it also documents that the Problems widget can bypass filtering when it uses incremental `update(...)` instead of a full reset.

- `f9dd5e1a8dc` - `chat: better problems integration (#241276)`
  This older change touched `markersView.ts` to integrate Problems with chat-related diagnostics. That makes the Problems view the right integration point for prompt-file diagnostics, rather than the prompt validator itself.

- Blame on `src/vs/workbench/contrib/chat/common/promptSyntax/languageProviders/promptValidator.ts`
  The `Unknown model` warning line was introduced in January 2026, and the `Unknown tool` warning path dates back to November 2025. That means the warnings themselves are older than this March 2026 issue. The newer March 2026 validator change (`b7d981c0ca9`, subagent enablement warnings) does not touch the `Unknown tool` / `Unknown model` behavior that users reported.

- Prompt-file discovery confirms user-scoped prompt sources
  `src/vs/workbench/contrib/chat/common/promptSyntax/config/promptFileLocations.ts` and `src/vs/workbench/contrib/chat/common/promptSyntax/utils/promptFilesLocator.ts` show that agent files can come from `PromptsStorage.user` / Copilot personal locations, so prompt diagnostics are not limited to workspace files.

### Time Window Used

- Initial: 24 hours
- Final: 168 hours (expanded twice)

The ancestry-window search around the parent commit did not reveal a nearby regression in the suspect files, so the useful context came from targeted file history and blame on `markersView.ts` and `promptValidator.ts`.

## Root Cause

`MarkersView` currently reads all markers from `IMarkerService` and, unless the user manually enables the `Show Active File Only` filter, `getResourceMarkers()` returns every `ResourceMarkers` entry in the model. That includes prompt-validator markers for user-scoped Copilot prompt files discovered outside the workspace.

In other words, the validator is doing its job, but the Problems view is treating non-workspace prompt files like normal project resources. Because the view is not scoped to workspace resources or open editors, prompt diagnostics from user/global-storage files leak into every workspace's Problems panel.

There is a second implementation detail that matters for the fix: `markersView.ts` has an incremental update path (`widget.update([...updated])`). The earlier `45d5d7cd4cb` fix already proved that widget updates can reintroduce items that should have been filtered. So the fix cannot be only a `getResourceMarkers()` filter; it also needs to refresh/reset when editor membership changes and when updates touch resources that are currently out of scope.

## Proposed Fix

### Option A: Targeted Fix (Recommended)

**Affected Files:**

- `src/vs/workbench/contrib/markers/browser/markersView.ts`
- A browser test in `src/vs/workbench/contrib/markers/test/browser/` covering non-workspace markers

**Changes Required:**

1. In `MarkersView`, filter the list returned by `getResourceMarkers()` so that the Problems panel shows:
   - all markers for resources inside the current workspace, and
   - markers for non-workspace resources only when that resource is currently open in an editor.

2. Compute the open-editor resource set from `IEditorService.editors` using `EditorResourceAccessor`, ideally considering both original and canonical URIs so user-data/file URI variants do not both leak through.

3. Refresh the Problems view when the open-editor set changes, not just when the active editor changes. `onDidEditorsChange` is the relevant signal if the intended behavior is “open in an editor” rather than “currently visible”.

4. Treat this new resource-scoping rule like the existing active-file filter in the update path:
   - if marker changes touch resources that are currently filtered out, do a full widget reset instead of incremental `widget.update(...)`.
   - otherwise the table/tree can reinsert or corrupt entries for resources that should remain hidden.

**Code Sketch:**

```ts
private shouldShowInProblems(resource: URI): boolean {
	if (this.workspaceContextService.getWorkspaceFolder(resource)) {
		return true;
	}

	return this.getOpenEditorResources().has(resource);
}

private getOpenEditorResources(): ResourceSet {
	const resources = new ResourceSet();

	for (const editor of this.editorService.editors) {
		this.addEditorResource(resources, EditorResourceAccessor.getOriginalUri(editor, { supportSideBySide: SideBySideEditor.BOTH }));
		this.addEditorResource(resources, EditorResourceAccessor.getCanonicalUri(editor, { supportSideBySide: SideBySideEditor.BOTH }));
	}

	return resources;
}

private getResourceMarkers(): ResourceMarkers[] {
	const base = this.filters.activeFile
		? this.currentActiveResource ? [this.markersModel.getResourceMarkers(this.currentActiveResource)].filter(isDefined) : []
		: this.markersModel.resourceMarkers;

	return base.filter(resourceMarkers => this.shouldShowInProblems(resourceMarkers.resource));
}

// Recompute when tabs/editors are opened or closed.
disposables.push(this.editorService.onDidEditorsChange(() => this.refreshPanel()));

// Avoid incremental updates for resources that are currently filtered out.
if (markerOrChange.added.size || markerOrChange.removed.size || this.filters.activeFile ||
	[...markerOrChange.updated].some(rm => !this.shouldShowInProblems(rm.resource))) {
	this.resetWidget();
} else {
	this.widget.update([...markerOrChange.updated]);
}
```

This keeps prompt diagnostics intact when a user deliberately opens the prompt file, while removing unrelated user-data noise from the global Problems list.

### Option B: Comprehensive Fix (Optional)

Adjust prompt validation so that unknown optional tools/models in built-in Copilot personal prompt files are downgraded to `Info` or suppressed when the missing dependency is explicitly optional.

Trade-offs:

- This is broader and riskier because it changes validation semantics for prompt files.
- It would hide potentially useful diagnostics from users who intentionally edit those files.
- It still does not solve the more general Problems-view issue for other non-workspace resources.

Because of that, I would not lead with a validator-side change for this issue.

## Confidence Level: Medium

## Reasoning

The strongest evidence is the combination of:

- maintainer guidance in the issue that the Problems view should only surface these files when open,
- `markersView.ts` already owning the active-file scoping logic,
- `PromptFilesLocator` explicitly discovering user-scoped prompt files, and
- the prior `45d5d7cd4cb` fix proving that filtered Problems views must be careful to avoid incremental widget updates for out-of-scope resources.

I do not think the right root fix is in `promptValidator.ts`, because the warning code predates this issue and the warnings themselves are semantically correct. The bug is that `MarkersView` aggregates those external prompt markers as if they were normal workspace problems.

If the recommended change is made, the specific symptom from the issue goes away:

- Copilot prompt files in user/global storage no longer pollute the Problems panel in unrelated workspaces.
- If a user actually opens one of those prompt files, its diagnostics still appear, which preserves discoverability and editor squiggles.
- The duplicate `file://` / `vscode-userdata://` entries should also stop polluting the panel because only the resource that is actually open should remain eligible for display.