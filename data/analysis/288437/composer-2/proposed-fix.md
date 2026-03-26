# Bug Analysis: Issue #288398

## Understanding the Bug

The console reports **`[LEAKED DISPOSABLE]`** from `GCBasedDisposableTracker` when using **Change Language Mode**. The stack shows:

- `ShowLanguageExtensionsAction` is constructed (`editorStatus.ts`, via `InstantiationService.createInstance`)
- The call path is `ChangeLanguageAction.run` → quick input flow

`Action` in `vs/base/common/actions.ts` **extends `Disposable`**. Anything instantiated with `createInstance` that subclasses `Disposable` must be **disposed** when no longer needed. Here, a `ShowLanguageExtensionsAction` is created every time the language picker is opened and is **never disposed**, whether the user picks another item, dismisses the picker, or runs the gallery action.

## Git History Analysis

```text
parent_time=2026-01-16T18:49:57Z (parent of PR 288437)
739c2c5a35a fix leak (#288434)
```

The 24h window before `parentCommit` only shows the immediate parent commit (another leak fix). No further expansion was required to locate the offending pattern in `ChangeLanguageAction.run`.

### Time Window Used

- Initial: 24 hours
- Final: 24 hours (no expansion)

## Root Cause

In `ChangeLanguageAction.run`, when `hasLanguageSupport && resource`:

```1214:1221:src/vs/workbench/browser/parts/editor/editorStatus.ts
		let galleryAction: Action | undefined;
		if (hasLanguageSupport && resource) {
			const ext = extname(resource) || basename(resource);

			galleryAction = instantiationService.createInstance(ShowLanguageExtensionsAction, ext);
			if (galleryAction.enabled) {
				picks.unshift(galleryAction);
			}
```

`ShowLanguageExtensionsAction` extends `Action` → `Disposable`. After `quickInputService.pick` completes (any outcome), this instance is still registered as a disposable and triggers the leak detector.

## Proposed Fix

### Option A: Targeted Fix (Recommended)

**Affected Files:**

- `src/vs/workbench/browser/parts/editor/editorStatus.ts`

**Changes Required:**

Wrap the language-picker section (from creation of `galleryAction` through all branches that consume `pick`) in `try` / `finally` and call **`galleryAction?.dispose()`** in `finally`, so every exit path (cancel, other pick, early `return` after `galleryAction.run()`, or later language-change logic) releases the disposable.

Alternatively, use an existing **`DisposableStore`**: `const store = new DisposableStore();`, then `galleryAction = store.add(instantiationService.createInstance(ShowLanguageExtensionsAction, ext))`, and `store.dispose()` in `finally` after the pick and related handling—same effect, slightly more scalable if more disposables are added beside the gallery action.

**Code Sketch:**

```typescript
let galleryAction: ShowLanguageExtensionsAction | undefined;
try {
	if (hasLanguageSupport && resource) {
		const ext = extname(resource) || basename(resource);
		galleryAction = instantiationService.createInstance(ShowLanguageExtensionsAction, ext);
		if (galleryAction.enabled) {
			picks.unshift(galleryAction);
		}
		// ... other unshifted items ...
	}
	const pick = typeof languageMode === 'string' ? { label: languageMode } : await quickInputService.pick(picks, { ... });
	if (!pick) {
		return;
	}
	if (pick === galleryAction) {
		await galleryAction.run();
		return;
	}
	// ... remainder of run() ...
} finally {
	galleryAction?.dispose();
}
```

Ensure `finally` covers **all** code paths that can run after `galleryAction` is assigned (including the long tail after `pick` for language changes). If the method structure makes a single `try/finally` awkward, dispose immediately after the quick-pick result is handled and every branch that compares to `galleryAction` has finished—**the invariant is: dispose exactly once after the picker session ends.**

### Option B: Comprehensive Fix (Optional)

Refactor the marketplace entry to a plain **`IQuickPickItem`** with a handler that calls `ICommandService.executeCommand('workbench.extensions.action.showExtensionsForLanguage', ext)` and duplicates the enabled check via `IExtensionGalleryService.isEnabled()`, avoiding `Action` / `Disposable` for a row that is only used inside a quick pick. This removes the leak class entirely but duplicates logic now encapsulated in `ShowLanguageExtensionsAction`.

## Confidence Level: High

## Reasoning

The stack trace names `ShowLanguageExtensionsAction` construction and `ChangeLanguageAction.run`; in the parent commit, that action is a `Disposable` created with `createInstance` and never disposed. Disposing it when the picker flow completes matches VS Code’s lifecycle rules for `Disposable` and directly addresses the reported `[LEAKED DISPOSABLE]` symptom.
