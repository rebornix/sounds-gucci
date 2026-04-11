# Bug Analysis: Issue #304488

## Understanding the Bug

The failure is in the integration test for `chat - run_in_terminal`, specifically the `shell integration on` / `sandbox off` case that checks multiline output ordering. On Windows, the test invokes:

```pwsh
echo M1 ; echo M2 ; echo M3
```

and expects the tool result text to contain all three lines in order. Instead, the test sometimes gets only the first line (`M1_...`).

This is not the shell-integration-off fallback path. The test already allows `Command produced no output` when shell integration is disabled, but with shell integration enabled it expects the tool to return the full terminal output.

## Git History Analysis

The branch-wide ancestry near the parent commit was sparse, so I expanded from the initial 24-hour window to a 7-day file-scoped history on the test and terminal chat-tool execution files.

Relevant ancestor commits:

- `5563927f890` `Fix terminal output capture: prevent premature idle detection and handle partial command echoes`
  - Added the exact Windows `;`-separator multiline test.
  - Hardened `stripCommandEchoAndPrompt` for wrapped/partial command echoes.
  - Left the shell-integration strategies preferring `finishedCommand.getOutput()` whenever it is defined.
- `5a791c66df1` `Use bracketed paste mode for run_in_terminal tool (#304268)`
  - Touched the same execute strategies, but only changed how commands are sent.
- `c4f707a8a49` `tweak run_in_terminal changes (#304843)`
  - Only adjusted the shell-integration timeout override in tests.

The recent history strongly suggests the remaining gap is not prompt stripping anymore. The likely gap is in how shell-integration completion/output is selected for PowerShell chained statements.

### Time Window Used

- Initial: 24 hours
- Final: 168 hours (expanded twice, then narrowed to file-scoped ancestor history)

## Root Cause

On Windows PowerShell, a semicolon-chained command like `echo M1 ; echo M2 ; echo M3` can surface shell-integration completion/output for only the first statement in the chain.

`RichExecuteStrategy` currently treats the first `onCommandFinished` event as authoritative, then prefers `finishedCommand.getOutput()` over marker-based output whenever that value is defined. If the finished-command object only represents the first subcommand, the tool returns `M1` and never upgrades to the fuller terminal-buffer output.

`BasicExecuteStrategy` is less exposed because it waits for prompt idleness after the finish event, but it has the same output-source preference and should be hardened the same way.

## Proposed Fix

### Option A: Targeted Fix (Recommended)

**Affected Files:**

- `src/vs/workbench/contrib/terminalContrib/chatAgentTools/browser/executeStrategy/richExecuteStrategy.ts`
- `src/vs/workbench/contrib/terminalContrib/chatAgentTools/browser/executeStrategy/basicExecuteStrategy.ts`
- `src/vs/workbench/contrib/terminalContrib/chatAgentTools/browser/executeStrategy/strategyHelpers.ts`
- `extensions/vscode-api-tests/src/singlefolder-tests/chat.runInTerminal.test.ts`
- `src/vs/workbench/contrib/terminalContrib/chatAgentTools/test/browser/strategyHelpers.test.ts`

**Changes Required:**

1. In `RichExecuteStrategy`, do not finalize immediately on the first `onCommandFinished` event. Mirror the basic strategy by waiting for a short prompt-idle confirmation before capturing output.
2. In both rich and basic strategies, collect marker-based output even when `finishedCommand.getOutput()` is defined.
3. Normalize both sources with `stripCommandEchoAndPrompt`, then prefer marker output when it is a clear superset/extension of the shell-reported output.
4. Add a regression test that covers the PowerShell chained-command case where shell integration reports only the first statement's output.

**Code Sketch:**

```ts
const idlePromptPromise = trackIdleOnPrompt(this._instance, idlePollInterval, store, idlePollInterval);

const onDone = Promise.race([
  Event.toPromise(this._commandDetection.onCommandFinished, store).then(command => {
    return idlePromptPromise.then(() => ({ type: 'success', command } as const));
  }),
  Event.toPromise(token.onCancellationRequested as Event<undefined>, store).then(() => undefined),
  Event.toPromise(this._instance.onDisposed, store).then(() => ({ type: 'disposal' } as const)),
  trackIdleOnPrompt(this._instance, idlePollInterval * 3, store, idlePollInterval).then(() => undefined),
]);

const finishedOutput = finishedCommand?.getOutput();
const strippedFinished = finishedOutput
  ? stripCommandEchoAndPrompt(finishedOutput, commandLine, this._log.bind(this))
  : undefined;

const markerOutput = xterm.getContentsAsText(this._startMarker.value, endMarker);
const strippedMarker = markerOutput
  ? stripCommandEchoAndPrompt(markerOutput, commandLine, this._log.bind(this))
  : undefined;

output = choosePreferredCommandOutput(strippedFinished, strippedMarker);
```

The selection helper should prefer marker output when both sources exist and the marker output is a strict extension of the finished-command output, such as `M1\nM2\nM3` vs `M1`.

### Option B: PowerShell-Specific Fallback

Detect PowerShell chained commands (`;` separators or rewritten `&&`) and bypass `finishedCommand.getOutput()` entirely for those commands, using marker-based capture after prompt idle.

This is narrower, but it bakes shell-specific heuristics into the execution path and risks missing similar bugs in other shells or future shell-integration edge cases.

## Confidence Level: Medium

## Reasoning

The failure mode matches the current rich shell-integration logic very closely: if the command-finished event/output only covers the first statement in a PowerShell chain, the strategy returns exactly the observed `M1_...` result. The recent ancestor history also shows that prompt stripping and wrapped echo handling were already being actively fixed, which makes incomplete output selection/completion timing the most plausible remaining root cause.