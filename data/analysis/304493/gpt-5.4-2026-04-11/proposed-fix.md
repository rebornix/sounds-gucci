# Bug Analysis: Issue #304493

## Understanding the Bug
The issue reports that after using the integrated browser, the Output panel with scope set to Window shows a warning from the editor resolver: `Editor ID Mismatch: workbench.editor.browser !== workbench.editorinputs.browser`. That warning is emitted when the editor resolver selects a registered editor id that does not match the `editorId` reported by the `EditorInput` instance it created, which means the browser editor's registration metadata is inconsistent with the browser input itself.

## Git History Analysis
- The 24-hour window before parent commit `1bf796e808ae3165386743c06d248a60ad9f9d78` only shows `1bf796e808a Let browser pages handle key events first (#304490)`. Expanding to 3 days and 7 days does not reveal any additional nearby commits.
- The relevant signal comes from file history instead of the time window. `BrowserEditorResolverContribution` in `src/vs/workbench/contrib/browserView/electron-browser/browserView.contribution.ts` was introduced in `f85cf0ad0cc Integrated Browser (#278677)` with `id: BrowserEditorInput.ID`.
- Later browser work introduced a separate editor-pane id, `BrowserEditorInput.EDITOR_ID = 'workbench.editor.browser'`, and the actual editor pane wiring was updated to use it, but the resolver registration and untyped override path were left on `BrowserEditorInput.ID`.

### Time Window Used
- Initial: 24 hours
- Final: 168 hours (expanded twice; no additional nearby commits were relevant, so file history and blame were used)

## Root Cause
The integrated browser now has two identifiers with different purposes: `BrowserEditorInput.ID` (`workbench.editorinputs.browser`) for the input type/serializer, and `BrowserEditorInput.EDITOR_ID` (`workbench.editor.browser`) for the actual editor pane. The browser input correctly reports `editorId = BrowserEditorInput.EDITOR_ID`, but the browser resource resolver still registers the editor under `BrowserEditorInput.ID`, and `BrowserEditorInput.toUntyped()` also serializes that wrong override. As a result, the resolver picks `workbench.editorinputs.browser` as the selected editor id while the created input reports `workbench.editor.browser`, triggering the warning and risking downstream editor-id-based behavior.

## Proposed Fix

### Option A: Targeted Fix (Recommended)
**Affected Files:**
- `src/vs/workbench/contrib/browserView/electron-browser/browserView.contribution.ts`
- `src/vs/workbench/contrib/browserView/common/browserEditorInput.ts`

**Changes Required:**
1. In `BrowserEditorResolverContribution`, change the `id` passed to `editorResolverService.registerEditor(...)` from `BrowserEditorInput.ID` to `BrowserEditorInput.EDITOR_ID`.
2. In `BrowserEditorInput.toUntyped()`, change `options.override` from `BrowserEditorInput.ID` to `BrowserEditorInput.EDITOR_ID`.
3. Leave `BrowserEditorInput.ID` in place for serializer/type identity (`typeId`, serializer registration), but stop using it as the runtime editor resolver id.

**Code Sketch:**
```ts
// src/vs/workbench/contrib/browserView/electron-browser/browserView.contribution.ts
editorResolverService.registerEditor(
        `${Schemas.vscodeBrowser}:/**`,
        {
                id: BrowserEditorInput.EDITOR_ID,
                label: localize('browser.editorLabel', "Browser"),
                priority: RegisteredEditorPriority.exclusive
        },
        ...
);

// src/vs/workbench/contrib/browserView/common/browserEditorInput.ts
override toUntyped(): IUntypedEditorInput {
        const viewState: IBrowserEditorViewState = {
                url: this.url,
                title: this.title,
                favicon: this.favicon
        };

        return {
                resource: this.resource,
                options: {
                        override: BrowserEditorInput.EDITOR_ID,
                        viewState
                }
        };
}
```

**Suggested Regression Test:**
Add a regression test in `src/vs/workbench/services/editor/test/browser/editorResolverService.test.ts` that resolves a `vscodeBrowser:` resource and asserts the resolved editor input's `editorId` matches the selected registered editor id. A smaller fallback test is to verify `BrowserEditorInput.toUntyped().options.override === BrowserEditorInput.EDITOR_ID`.

### Option B: Comprehensive Fix (Optional)
Add a small invariant test/helper for workbench editors that distinguish `typeId` from `editorId`, so `registerEditor(...).id`, `EditorInput.editorId`, and `toUntyped().options.override` must stay aligned. That is broader than needed here, but it would prevent similar regressions in other custom editors.

## Confidence Level: High

## Reasoning
The warning text is emitted directly in `editorResolverService` when `input.editor.editorId !== selectedEditor.editorInfo.id`. The browser input class already returns `workbench.editor.browser`, and the browser editor pane itself is registered and constructed with that same editor id. The inconsistent pieces are the browser resolver registration and the serialized override, both of which still use `workbench.editorinputs.browser`. Changing those two call sites to `BrowserEditorInput.EDITOR_ID` removes the mismatch at the source and matches the pattern used by other custom editors that carry a distinct runtime editor id.