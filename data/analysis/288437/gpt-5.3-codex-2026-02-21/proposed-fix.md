# Bug Analysis: Issue #288398

## Understanding the Bug

**Issue Title:** Leak  
**Repository:** microsoft/vscode  
**Issue Number:** #288398  
**Author:** @bpasero  

The issue reports a leaked disposable with the following stack trace:

```
[LEAKED DISPOSABLE] Error: CREATED via:
    at new Disposable (lifecycle.js:416:9)
    at new Action (actions.js:16:9)
    at new ShowLanguageExtensionsAction (editorStatus.js:924:9)
    at InstantiationService._createInstance (instantiationService.js:130:24)
    at InstantiationService.createInstance (instantiationService.js:101:27)
    at ChangeLanguageAction.run (editorStatus.js:1015:50)
```

The leak occurs when a `ShowLanguageExtensionsAction` instance is created but never disposed. Since `Action` extends `Disposable`, any instance must be properly disposed to prevent memory leaks.

## Git History Analysis

### Time Window Used
- Initial: 24 hours
- Expanded to: 3 days
- Final: 7 days (expansion needed due to limited recent activity)

### Relevant Commits Found

1. **Commit cce0642bfb8** (2026-01-16, ~10 hours before the issue was reported)
   - Title: "If the users selects a language, let's have it actually choose the language they selected. (Yaml vs yaml) (#288153)"
   - Modified: `src/vs/workbench/browser/parts/editor/editorStatus.ts`
   - Changes: Added `id` field to language picker items and changed language selection to use `pick.id` instead of deriving it from `pick.label`
   - **Relevance:** This commit modified the same file and specifically the `ChangeLanguageAction.run` method where the leak occurs, but did not introduce the leak itself.

2. **No recent commits** modified the `ShowLanguageExtensionsAction` class or its instantiation pattern within the 7-day window.

The leak appears to be a **pre-existing bug** rather than a regression from a recent commit. The `ShowLanguageExtensionsAction` instantiation pattern has been in place for some time without proper disposal.

## Root Cause

The bug is in the `ChangeLanguageAction.run` method in `src/vs/workbench/browser/parts/editor/editorStatus.ts` around line 1218.

**The Problem:**
```typescript
let galleryAction: Action | undefined;
if (hasLanguageSupport && resource) {
    const ext = extname(resource) || basename(resource);
    
    galleryAction = instantiationService.createInstance(ShowLanguageExtensionsAction, ext);
    if (galleryAction.enabled) {
        picks.unshift(galleryAction);
    }
    // ... more code ...
}

// Later in the method:
if (pick === galleryAction) {
    galleryAction.run();
    return;  // ❌ Returns without disposing galleryAction
}
```

The `galleryAction` is created as an instance of `ShowLanguageExtensionsAction`, which extends `Action`, which in turn extends `Disposable`. The VS Code disposable tracking system detects that this instance is never disposed of, leading to the memory leak.

**Key Issues:**
1. The action is instantiated in the middle of an async method
2. The method has multiple early return paths
3. None of the return paths dispose of the `galleryAction`
4. Even when `galleryAction` is not selected by the user, it's never disposed

## Proposed Fix

### Option A: Targeted Fix - Add finally block (Recommended)

**Affected Files:**
- `src/vs/workbench/browser/parts/editor/editorStatus.ts`

**Changes Required:**

Wrap the action creation and quick pick logic in a try-finally block to ensure disposal:

**Code Sketch:**
```typescript
override async run(accessor: ServicesAccessor, languageMode?: string): Promise<void> {
    const quickInputService = accessor.get(IQuickInputService);
    const editorService = accessor.get(IEditorService);
    const languageService = accessor.get(ILanguageService);
    const languageDetectionService = accessor.get(ILanguageDetectionService);
    const textFileService = accessor.get(ITextFileService);
    const preferencesService = accessor.get(IPreferencesService);
    const instantiationService = accessor.get(IInstantiationService);
    const configurationService = accessor.get(IConfigurationService);
    const telemetryService = accessor.get(ITelemetryService);

    // ... existing code to set up editor and textModel ...
    
    let galleryAction: Action | undefined;
    try {
        // ... all existing logic for creating picks, including:
        if (hasLanguageSupport && resource) {
            const ext = extname(resource) || basename(resource);

            galleryAction = instantiationService.createInstance(ShowLanguageExtensionsAction, ext);
            if (galleryAction.enabled) {
                picks.unshift(galleryAction);
            }
            // ... rest of picks setup ...
        }
        
        // ... rest of the method logic ...
        const pick = typeof languageMode === 'string' ? { label: languageMode } : await quickInputService.pick(picks, { placeHolder: localize('pickLanguage', "Select Language Mode"), matchOnDescription: true });
        if (!pick) {
            return;
        }

        if (pick === galleryAction) {
            galleryAction.run();
            return;
        }
        
        // ... rest of method ...
        
    } finally {
        // Ensure galleryAction is disposed regardless of code path
        galleryAction?.dispose();
    }
}
```

**Why this is minimal:**
- Single structural change (add try-finally)
- No refactoring of existing logic
- Handles all code paths (selection, cancellation, other picks)
- Follows common VS Code patterns for ensuring disposal

### Option B: Comprehensive Fix - Use DisposableStore

If we wanted to be more thorough and handle potential future disposables in this method:

**Code Sketch:**
```typescript
override async run(accessor: ServicesAccessor, languageMode?: string): Promise<void> {
    const disposables = new DisposableStore();
    try {
        // ... service accessor calls ...
        
        if (hasLanguageSupport && resource) {
            const ext = extname(resource) || basename(resource);

            const galleryAction = disposables.add(
                instantiationService.createInstance(ShowLanguageExtensionsAction, ext)
            );
            if (galleryAction.enabled) {
                picks.unshift(galleryAction);
            }
            // ... rest ...
        }
        
        // ... rest of method ...
        
    } finally {
        disposables.dispose();
    }
}
```

**Trade-offs:**
- **Pro:** More robust for future additions of disposable resources
- **Pro:** Consistent with other VS Code patterns using DisposableStore
- **Con:** Slightly more code changes
- **Con:** May be overkill for a single disposable

## Confidence Level: High

## Reasoning

**Why I'm confident this fix addresses the root cause:**

1. **Direct Match with Stack Trace:** The stack trace explicitly points to line 1015 in `editorStatus.ts` where `instantiationService.createInstance` is called within `ChangeLanguageAction.run`, which matches exactly with the code at line 1218 (accounting for line number shifts).

2. **Clear Disposable Lifecycle Violation:** The `ShowLanguageExtensionsAction` extends `Action`, which extends `Disposable`. VS Code's disposable tracking infrastructure explicitly requires that all `Disposable` instances be disposed. The current code never calls `dispose()` on `galleryAction`.

3. **Multiple Leak Paths Identified:**
   - User selects `galleryAction`: runs it and returns without disposal
   - User selects another option: returns without disposal  
   - User cancels the picker: returns without disposal

4. **Validation Against Codebase Patterns:**
   - Other parts of the same file use `this._register()` for long-lived disposables (lines showing `currentMarkerStatus`, `tabFocusMode`, `inputMode`)
   - For short-lived disposables created in methods, try-finally blocks are commonly used in the VS Code codebase
   - The `Action` base class in `src/vs/base/common/actions.ts` confirms it extends `Disposable`

5. **The Fix Resolves All Code Paths:** Adding a finally block with `galleryAction?.dispose()` ensures disposal regardless of which branch is taken, addressing the exact symptom described in the issue.

**Mental trace validation:**
- Before fix: `galleryAction` created → method returns → object not disposed → leak detector fires
- After fix: `galleryAction` created → try block executes (any path) → finally block ensures disposal → no leak

The minimal fix (Option A) is the correct solution: wrap the method body in try-finally and dispose of `galleryAction` in the finally block.
