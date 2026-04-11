# Bug Analysis: Issue #303429

## Understanding the Bug

The regression only reproduces in Insiders with the new command-center/title-bar experience. Custom `window.title` templates still resolve built-in values such as `${activeFolderMedium}`, but SCM-backed values such as `${activeRepositoryName}` and `${activeRepositoryBranchName}` disappear. When those values are empty, `${separator}` also collapses, which matches the screenshots and comments exactly.

This strongly suggests the bug is not in SCM itself and not in the generic `WindowTitle` formatter used by stable. It is specific to the new title-bar widget path that Insiders is rendering.

## Git History Analysis

I started from parent commit `85ba79cf0226ebf10f7abf28b86a5ed1b27a1c00`.

- 24-hour window: no relevant titlebar/SCM/widget changes.
- 3-day window: still no relevant titlebar/SCM/widget changes.
- 7-day window: this is where the useful history appears.

Relevant commits found in the 7-day window:

- `2bfd66adc03` - `fixed window.title`
  - This changed `src/vs/workbench/contrib/chat/browser/agentSessions/experiments/agentTitleBarStatusWidget.ts` to create its own `WindowTitle` instance via `createInstance(WindowTitle, mainWindow)`.
  - It also switched the widget to use that instance for label computation.

- `ca12dcbdd24` - `fixed setting and window title`
  - This refined `_getLabel()` so that when the user has a custom title format, the widget calls `this._windowTitle.getWindowTitle()`.
  - That makes the new private `WindowTitle` instance the source of truth for the compact/unified command-center label.

- `src/vs/workbench/contrib/scm/browser/activity.ts`
  - SCM registers `activeRepositoryName` and `activeRepositoryBranchName` through `titleService.registerVariables(...)`.
  - Those variables are only propagated to actual titlebar parts managed by the title service.

- `src/vs/workbench/browser/parts/titlebar/commandCenterControl.ts`
  - The normal command-center view item does not create its own title state.
  - It receives the already configured shared `WindowTitle` instance from the main titlebar.

### Time Window Used

- Initial: 24 hours
- Final: 7 days
- Expansion: expanded twice because the 24-hour and 3-day windows had no relevant history

## Root Cause

The experimental agent/unified title-bar widget creates a separate `WindowTitle` object that never receives the custom title variables registered through `ITitleService`. As a result, built-in variables such as `${activeFolderMedium}` still resolve, but SCM variables such as `${activeRepositoryName}` and `${activeRepositoryBranchName}` resolve to empty strings, which also suppresses `${separator}`.

## Proposed Fix

### Option A: Targeted Fix (Recommended)

**Affected Files:**

- `src/vs/workbench/contrib/chat/browser/agentSessions/experiments/agentTitleBarStatusWidget.ts`
- `src/vs/workbench/services/title/browser/titleService.ts`

**Changes Required:**

Add a small title-service API that can seed a `WindowTitle` instance with the same properties and registered variables that the main titlebar uses. Then use that API when constructing the experimental agent title-bar widget's `_windowTitle`.

This keeps the current widget behavior, but ensures the widget sees the same registered title variables as the normal command center.

**Code Sketch:**

```ts
// titleService.ts
configureWindowTitle(windowTitle: WindowTitle): void {
	if (this.properties) {
		windowTitle.updateProperties(this.properties);
	}

	if (this.variables.size) {
		windowTitle.registerVariables(Array.from(this.variables.values()));
	}
}

// agentTitleBarStatusWidget.ts
this._windowTitle = this._register(this.instantiationService.createInstance(WindowTitle, mainWindow));
this.titleService.configureWindowTitle(this._windowTitle);
```

**Why this is the right fix:**

- It fixes the architectural gap instead of hard-coding SCM behavior into the chat widget.
- It restores parity with the normal command center, which already uses a configured/shared `WindowTitle`.
- It also covers any future custom `window.title` variables beyond SCM.

### Option B: Minimal Workaround

**Affected Files:**

- `src/vs/workbench/contrib/chat/browser/agentSessions/experiments/agentTitleBarStatusWidget.ts`

**Changes Required:**

After creating `_windowTitle`, manually register the SCM variables on that local instance:

- `activeRepositoryName` -> `scmActiveRepositoryName`
- `activeRepositoryBranchName` -> `scmActiveRepositoryBranchName`

**Code Sketch:**

```ts
this._windowTitle.registerVariables([
	{ name: 'activeRepositoryName', contextKey: 'scmActiveRepositoryName' },
	{ name: 'activeRepositoryBranchName', contextKey: 'scmActiveRepositoryBranchName' }
]);
```

**Trade-offs:**

- This is smaller, but it duplicates title-variable knowledge in the widget.
- It only fixes the currently known SCM variables.
- It does not solve the broader problem of secondary title consumers missing title-service state.

## Confidence Level: High

## Reasoning

The evidence lines up cleanly:

- `WindowTitle.getWindowTitle()` only resolves custom variables that were previously registered via `registerVariables(...)`.
- SCM contributes `activeRepositoryName` and `activeRepositoryBranchName` only through `ITitleService`.
- The broken Insiders widget uses a fresh `WindowTitle` instance introduced in `2bfd66adc03` and relied on more heavily in `ca12dcbdd24`.
- The normal command-center path reuses a configured `WindowTitle`, which explains why the old/stable behavior works.
- The issue timing matches the March 18-19 commits found in the 7-day window.

If I had to implement this blind, I would start with Option A and add a regression test that renders the compact agent title-bar widget with `window.title = ${activeRepositoryName}${separator}${activeFolderMedium}` while the SCM context keys are populated.