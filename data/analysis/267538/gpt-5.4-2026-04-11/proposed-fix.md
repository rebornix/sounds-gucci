# Bug Analysis: Issue #267538

## Understanding the Bug

Moving a terminal into a new window causes the original window title to switch from the file it still has open to the moved terminal's title. The follow-up comment expands the scope: the same wrong-title behavior also happens when moving a search editor or a normal file into a new window. That strongly suggests the bug is not terminal-specific; it is a cross-window title-state leak.

Expected behavior is per-window isolation: the original window should keep showing its own active file title, while the new auxiliary window should show the moved terminal/editor title.

## Git History Analysis

### Time Window Used

- Initial: 24 hours
- Final: 168 hours (expanded twice)

The parent commit is `c2016b08f5d48a676858f04907c2b1c10ab03a44` from 2026-03-30T17:17:52Z.

The incremental history windows around that commit did not reveal a nearby relevant regression:

- 24 hours: only `c2016b08f5d Fix local history commands when resource URI scheme is vscode-local-history (#306147)`
- 3 days: same unrelated commit
- 7 days: same unrelated commit

Because the short history window was not useful, I used `git blame` on the relevant titlebar code.

### Relevant Older Regression Source

`git blame` on `src/vs/workbench/browser/parts/titlebar/titlebarPart.ts` points the `WindowTitle` instantiation at line 320 to commit `b76b9cbdcabf`:

- `b76b9cbdcabf aux window - scoped services alignments (#249095)`

That commit is a strong regression candidate because it changed how titlebar services are scoped for auxiliary windows.

Key findings from that older diff:

1. Before `b76b9cbdcabf`, `BrowserTitlebarPart` created a scoped editor service via `editorService.createScoped(editorGroupsContainer, this._store)` and `WindowTitle` also accepted the editor-groups container.
2. After `b76b9cbdcabf`, `BrowserTitlebarPart` instantiates `WindowTitle` directly with `instantiationService.createInstance(WindowTitle, targetWindow)`.
3. The current `WindowTitle` implementation reads title state entirely from `IEditorService`:
   - listens on `editorService.onDidActiveEditorChange`
   - reads `editorService.activeEditor`
   - reads `editorService.activeTextEditorControl`
4. Auxiliary titlebars are still created through a scoped instantiation service in `src/vs/workbench/browser/parts/editor/auxiliaryEditorPart.ts`, so their `IEditorService` stays window-local.
5. The main titlebar is not given a scoped `IEditorService` for `WindowTitle`, so it observes shared active-editor state across windows.

## Root Cause

The main window's `WindowTitle` instance is bound to the shared `IEditorService` instead of an editor service scoped to that window's own `editorGroupsContainer`. When focus or active content moves into an auxiliary window, the shared editor service reports the auxiliary window's active item, and the original window title updates to that item even though the original window still has a different active editor.

This matches both the original report and the follow-up comment: terminal, search editor, and normal editor moves all go through the same cross-window active-editor/title path.

## Proposed Fix

### Option A: Targeted Fix (Recommended)

**Affected Files:**

- `src/vs/workbench/browser/parts/titlebar/titlebarPart.ts`

**Changes Required:**

Create a child instantiation service just for `WindowTitle` that overrides `IEditorService` with a scoped editor service for `this.editorGroupsContainer`, then instantiate `WindowTitle` from that child service.

This keeps the rest of `BrowserTitlebarPart` unchanged and fixes exactly the part that must be window-local: title computation. It also mirrors the existing auxiliary-window pattern, where the titlebar already receives scoped services.

**Code Sketch:**

```ts
import { ServiceCollection } from '../../../../platform/instantiation/common/serviceCollection.js';

const windowTitleInstantiationService = this._register(
	instantiationService.createChild(new ServiceCollection(
		[IEditorService, this.editorService.createScoped(this.editorGroupsContainer, this._store)]
	))
);

this.windowTitle = this._register(
	windowTitleInstantiationService.createInstance(WindowTitle, targetWindow)
);
```

**Why this is the minimal fix:**

- `WindowTitle` is the component that directly reads `activeEditor` and `activeTextEditorControl`.
- Auxiliary titlebars already behave correctly because they are created from a scoped instantiation service.
- Scoping only the `WindowTitle` instance avoids broader behavior changes in menus, toolbar actions, or other titlebar features.

**Validation to perform:**

1. Open a file in the main window.
2. Move a terminal into a new window.
3. Confirm the main window title still shows the original file.
4. Confirm the auxiliary window title shows the moved terminal.
5. Repeat by moving a search editor and a regular editor to verify the shared regression is gone.

### Option B: Comprehensive Fix (Optional)

Restore the pre-`b76b9cbdcabf` approach by reintroducing `editorGroupsContainer` into `WindowTitle` and having `WindowTitle` call `editorService.createScoped(...)` internally.

This should also work, but it spreads the change across more than one file and partially reverts an earlier API simplification. The targeted titlebar-side scoping is smaller and easier to reason about.

## Confidence Level: High

## Reasoning

The evidence lines up cleanly:

- The issue reproduces for more than terminals, which rules out a terminal-only bug.
- `WindowTitle` builds its title entirely from editor-service-driven state.
- The relevant regression commit removed direct scoping from the window-title path.
- Auxiliary windows still get scoped services, while the main window title does not.

If `WindowTitle` is instantiated with an editor service scoped to its own `editorGroupsContainer`, the original window will stop reacting to active-editor changes that belong to the auxiliary window, which is the exact symptom reported.