# Bug Analysis: Issue #7262

## Understanding the Bug

The issue asks for graphical feedback when a function breakpoint binds to a concrete source location. In the inspected parent tree, VS Code already renders function breakpoint icons in the Breakpoints view, so the missing behavior described by the issue is the editor-side glyph or decoration at the bound source line when the debug adapter reports one.

The issue comments also make this a bit retrospective: the discussion later redirects to another issue for Breakpoints view work, and explicitly says editor-margin glyphs were considered unsupported. That means the current analysis is less about a recent regression and more about whether the existing debug model can surface adapter-reported locations to the editor UI.

## Git History Analysis

- The recorded parent commit is `61e3ba6f0478142386500e4d17fc04ee319c8dcd` from `2026-03-30T21:57:09Z` with subject `skip flakey sandbox test for now  (#306417)`.
- The metadata PR title is unrelated to debugging, which does not match the issue. I treated the issue text as the source of truth and used the parent commit only as the code snapshot to inspect.
- I searched the allowed 24 hour, 3 day, and 7 day windows on the parent ancestry for the debug workbench code.
- No relevant commits appeared in any of those windows for the debug files involved in breakpoint rendering or function breakpoint session updates.

### Time Window Used

- Initial: 24 hours
- Final: 168 hours (expanded 2 times)

## Root Cause

The adapter response path already preserves function breakpoint binding data, but the editor decoration path never consumes it.

More concretely:

- `src/vs/workbench/contrib/debug/browser/debugSession.ts` calls `setBreakpointSessionData()` after `setFunctionBreakpoints()` and also when function breakpoints receive `breakpoint` change events.
- `src/vs/workbench/contrib/debug/common/debugModel.ts` stores the full `DebugProtocol.Breakpoint` payload in `BaseBreakpoint`, including `source`, `line`, and `column`.
- `FunctionBreakpoint` only exposes `name`, `condition`, and `hitCondition`; unlike `Breakpoint`, it does not expose a resolved `uri`, `lineNumber`, or `column`.
- `src/vs/workbench/contrib/debug/browser/breakpointEditorContribution.ts` only asks the model for source breakpoints with `getBreakpoints({ uri: model.uri })`, and `createBreakpointDecorations()` only accepts `IBreakpoint` inputs.

So even when the debug adapter reports a real bound source location for a function breakpoint, that information stops inside session data and never reaches the glyph-margin decoration layer.

## Proposed Fix

### Option A: Targeted Fix (Recommended)

**Affected Files:**

- `src/vs/workbench/contrib/debug/common/debug.ts`
- `src/vs/workbench/contrib/debug/common/debugModel.ts`
- `src/vs/workbench/contrib/debug/common/debugStorage.ts`
- `src/vs/workbench/contrib/debug/browser/breakpointEditorContribution.ts`
- `src/vs/workbench/contrib/debug/test/browser/breakpoints.test.ts`

**Changes Required:**

1. Extend `IFunctionBreakpoint` with optional resolved location fields such as `uri`, `lineNumber`, and `column`.
2. Update `FunctionBreakpoint` to expose those values from existing session data, mirroring how `Breakpoint` already projects adapter-moved locations from `this.data.source`, `this.data.line`, and `this.data.column`.
3. Pass the same URI and log services into `FunctionBreakpoint` that `Breakpoint` already uses, so the adapter `source` can be converted into a workspace URI in both live creation and storage restore code paths.
4. Broaden the editor decoration input in `breakpointEditorContribution.ts` so it merges line breakpoints with function breakpoints whose resolved `uri` matches the current editor model.
5. Reuse the existing `getBreakpointMessageAndIcon()` path so function breakpoint glyphs automatically get the correct function-breakpoint codicon and hover text.
6. Add a browser test that seeds a function breakpoint with adapter-reported `source` and `line` data and verifies that a glyph decoration is rendered in the matching editor model.

**Code Sketch:**

```ts
// debug.ts
export interface IFunctionBreakpoint extends IBaseBreakpoint {
	readonly name: string;
	readonly uri: uri | undefined;
	readonly lineNumber: number | undefined;
	readonly column: number | undefined;
	toDAP(): DebugProtocol.FunctionBreakpoint;
}

// debugModel.ts
export class FunctionBreakpoint extends BaseBreakpoint implements IFunctionBreakpoint {
	public name: string;

	constructor(
		opts: IFunctionBreakpointOptions,
		private readonly uriIdentityService: IUriIdentityService,
		private readonly logService: ILogService,
		id = generateUuid()
	) {
		super(id, opts);
		this.name = opts.name;
	}

	get uri(): uri | undefined {
		return this.verified && this.data?.source
			? getUriFromSource(this.data.source, this.data.source.path, this.data.sessionId, this.uriIdentityService, this.logService)
			: undefined;
	}

	get lineNumber(): number | undefined {
		return this.verified && this.data && typeof this.data.line === 'number' ? this.data.line : undefined;
	}

	get column(): number | undefined {
		return this.verified && this.data && typeof this.data.column === 'number' ? this.data.column : undefined;
	}
}

// breakpointEditorContribution.ts
const sourceBreakpoints = this.debugService.getModel().getBreakpoints({ uri: model.uri });
const functionBreakpoints = this.debugService.getModel().getFunctionBreakpoints()
	.filter((bp): bp is IFunctionBreakpoint & { uri: URI; lineNumber: number } => !!bp.uri && typeof bp.lineNumber === 'number' && this.uriIdentityService.extUri.isEqual(bp.uri, model.uri));

const desiredBreakpointDecorations = this.instantiationService.invokeFunction(accessor =>
	createBreakpointDecorations(accessor, model, [...sourceBreakpoints, ...functionBreakpoints], this.debugService.state, this.debugService.getModel().areBreakpointsActivated(), debugSettings.showBreakpointsInOverviewRuler)
);
```

This is the smallest fix that reaches the symptom directly: it does not invent synthetic source breakpoints or alter protocol handling, it only makes already-available adapter location data visible to the existing decoration pipeline.

### Option B: Comprehensive Fix (Optional)

Introduce a generic resolved-location abstraction on `IBaseBreakpoint` so source, function, data, and instruction breakpoints can all feed a single editor-decoration pipeline. That would make future non-source breakpoint glyph work cleaner, but it is broader than this issue needs.

## Confidence Level: Medium

## Reasoning

I am reasonably confident in the root cause because the code path is explicit:

- function breakpoint adapter responses are already stored;
- the stored payload already contains source and line data;
- the function breakpoint model does not project those fields outward; and
- the editor contribution only renders source breakpoints.

That combination precisely explains why users can have a valid, bound function breakpoint in the debug model without seeing any editor glyph for it.

Confidence is not high because the prepared directory is internally inconsistent: the issue is an old debug feature request, while the recorded metadata points at an unrelated modern PR and parent commit. Even with that mismatch, the proposed fix is the minimal code change that would make the described behavior work in the inspected tree.