# Bug Analysis: Issue #300854

## Understanding the Bug

Running a subagent can fail with `Cannot read properties of undefined (reading 'length')`. The issue comments narrow the failure to `runSubagentTool.ts`, specifically the block that remaps subagent hooks and the point where the subagent request is invoked. The reproduction mentions a `Stop` hook on an agent that is run via `runSubagent`, and the expected behavior is that this hook should execute as a subagent stop hook and be able to block the stop by returning hook output.

That points to the hook remapping path rather than the subagent execution itself: the bug happens while preparing the request for the subagent, before the subagent can complete normally.

## Git History Analysis

Recent history around the parent commit touched `runSubagentTool.ts`, but the nearby commits are about nested subagent depth and tool enablement rather than hooks:

- `cfbea10c5ff` / `d70ac11ea4f`: rename the nested subagent configuration from `maxDepth` to `allowInvocationsFromSubagents`
- `289b95b8b6f`: fix subagent tool id mismatch
- `3f9004083bc`: support nested subagents

Those commits explain why the maintainer also pointed to the `invokeAgent` call site near line 342, but they do not explain an undefined `.length` access in the hook path.

`git blame` on the suspect lines shows the actual regression source:

- `ffe529eced87` (`Add support for agent-scoped hooks (#299029)`) introduced the `Stop` to `SubagentStop` remapping block on lines 292-303.
- The same pre-fix file still computes `hasHooksEnabled` using `Object.values(collectedHooks).some(arr => arr.length > 0)` on line 322.

This combination is enough to explain the crash.

### Time Window Used

- Initial: 24 hours
- Final: 168 hours (expanded 2 times)
- Additional blame lookup outside the 7-day window: used to identify the original introducing commit on 2026-03-04

## Root Cause

When a subagent defines a `Stop` hook, `runSubagentTool.ts` remaps that hook to `SubagentStop` but then leaves `HookType.Stop` in the hook map with the value `undefined`. The request builder immediately evaluates `Object.values(collectedHooks).some(arr => arr.length > 0)`, so the undefined entry causes the exact `Cannot read properties of undefined (reading 'length')` exception.

## Proposed Fix

### Option A: Targeted Fix (Recommended)

**Affected Files:**
- `src/vs/workbench/contrib/chat/common/tools/builtinTools/runSubagentTool.ts`

**Changes Required:**

After moving the `Stop` hook array into `SubagentStop`, remove the `Stop` property entirely instead of assigning `undefined`. That keeps `collectedHooks` structurally valid, preserves the intended subagent stop semantics, and allows the existing `hasHooksEnabled` calculation to work without changes.

**Code Sketch:**

```ts
const remapped: ChatRequestHooks = { ...subagent.hooks };
const stopHooks = remapped[HookType.Stop];

if (stopHooks?.length) {
	const existingSubagentStop = remapped[HookType.SubagentStop];
	(remapped as Record<string, unknown>)[HookType.SubagentStop] = existingSubagentStop
		? [...existingSubagentStop, ...stopHooks]
		: stopHooks;

	delete (remapped as Partial<Record<HookType, unknown>>)[HookType.Stop];
}

collectedHooks = mergeHooks(collectedHooks, remapped);
```

This is the minimal fix because it removes the malformed value at the source instead of only papering over one read site.

### Option B: Defensive Hardening (Optional)

Make the enablement check resilient to sparse hook objects as a secondary guard:

```ts
hasHooksEnabled: !!collectedHooks && Object.values(collectedHooks).some(arr => !!arr?.length),
```

This is worth considering for robustness, but it should not replace the targeted fix because other consumers should not receive `ChatRequestHooks` objects with undefined entries.

## Confidence Level: High

## Reasoning

The error string matches the `arr.length` access exactly. The maintainer already suspected the remap block, and the reproduction with a `Stop` hook maps directly onto the `Stop` to `SubagentStop` conversion introduced by `ffe529eced87`. Removing the stale `Stop` entry keeps the remapped hook behavior intact while eliminating the undefined value that triggers the exception, so this change should restore the intended behavior where subagent stop hooks can run and block the stop output.