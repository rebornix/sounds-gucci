# Bug Analysis: Issue #303769

## Understanding the Bug

Terminal chat-agent commands normally avoid polluting shell history by combining two mechanisms:

- Tool terminals set `VSCODE_PREVENT_SHELL_HISTORY=1`, which makes shell integration enable `HISTCONTROL=ignorespace` in bash or `HIST_IGNORE_SPACE` in zsh.
- `CommandLinePreventHistoryRewriter` prepends a leading space for bash/zsh so the command actually sent to the shell is ignored by history.

When terminal sandboxing is enabled, commands are additionally rewritten into a sandbox-runtime wrapper before execution. The issue symptom fits a case where the history-prevention space exists on the inner command, but not on the final shell-visible wrapper command, so bash/zsh still record it in history.

There are no issue comments, so the issue body is the only user-facing context.

## Git History Analysis

The initial 24-hour and 3-day path-scoped history search did not surface useful terminal chat-agent commits, so I expanded to the full 7-day window and then used `git blame` on the suspect lines.

Relevant recent changes:

- `0b90e9416815` (2026-03-20), `Disable terminal sandboxing for confirmation prompts (#301940)`
  - Adds `CommandLineSandboxRewriter` into the `_commandLineRewriters` pipeline in `runInTerminalTool.ts`.
- `8a3bfca4c68b` (2026-03-17), `Reverting sandbox manager changes in main. (#302625)`
  - Contains the current `CommandLineSandboxRewriter` call to `wrapCommand(options.commandLine)` and the current `TerminalSandboxService.wrapCommand(...)` implementation that builds a new outer wrapper command.

These two changes together explain how sandbox wrapping entered the command rewrite pipeline shortly before the parent commit.

### Time Window Used

- Initial: 24 hours
- Final: 168 hours (expanded 2 times)

## Root Cause

`CommandLinePreventHistoryRewriter` runs before `CommandLineSandboxRewriter` in `src/vs/workbench/contrib/terminalContrib/chatAgentTools/browser/tools/runInTerminalTool.ts`.

That means bash/zsh commands are first rewritten from:

```sh
echo hello
```

to:

```sh
 echo hello
```

But then `CommandLineSandboxRewriter` passes that already-prefixed string into `TerminalSandboxService.wrapCommand(...)`, which creates a brand-new outer command like:

```sh
ELECTRON_RUN_AS_NODE=1 PATH="..." TMPDIR="..." ".../cli.js" --settings "..." -c ' echo hello'
```

At that point, the leading space is inside the quoted `-c` payload, not at the beginning of the command line seen by the user's shell. Bash/zsh history suppression only cares whether the outer command starts with a space, so the sandbox wrapper still gets written to shell history.

## Proposed Fix

### Option A: Targeted Fix (Recommended)

**Affected Files:**

- `src/vs/workbench/contrib/terminalContrib/chatAgentTools/browser/tools/runInTerminalTool.ts`
- `src/vs/workbench/contrib/terminalContrib/chatAgentTools/test/electron-browser/runInTerminalTool.test.ts`
- `src/vs/workbench/contrib/terminalContrib/chatAgentTools/test/electron-browser/commandLineSandboxRewriter.test.ts`
- `src/vs/workbench/contrib/terminalContrib/chatAgentTools/test/browser/strategyHelpers.test.ts` (optional safety regression)

**Changes Required:**

- Run `CommandLineSandboxRewriter` before `CommandLinePreventHistoryRewriter`.
- Keep `CommandLineCdPrefixRewriter` and `CommandLinePwshChainOperatorRewriter` before sandbox rewriting so they still modify the inner command that is executed inside the sandbox.
- Let the history-prevention rewriter run last so the final shell-visible wrapper command begins with a space on bash/zsh.
- Add a regression test that enables both sandboxing and `PreventShellHistory`, then asserts the rewritten command is sandbox-wrapped and still starts with a leading space.
- Optionally add a `strategyHelpers` regression test for a leading-space sandbox wrapper echo, though the current helper already trims command-line whitespace before matching and should remain compatible.

**Code Sketch:**

```ts
this._commandLineRewriters = [
	this._register(this._instantiationService.createInstance(CommandLineCdPrefixRewriter)),
	this._register(this._instantiationService.createInstance(CommandLinePwshChainOperatorRewriter, this._treeSitterCommandParser)),
];

if (this._enableCommandLineSandboxRewriting) {
	this._commandLineRewriters.push(
		this._register(this._instantiationService.createInstance(CommandLineSandboxRewriter))
	);
}

this._commandLineRewriters.push(
	this._register(this._instantiationService.createInstance(CommandLinePreventHistoryRewriter))
);
```

**Regression Test Sketch:**

```ts
test('preserves history suppression when sandbox wrapping is enabled', async () => {
	sandboxEnabled = true;
	setConfigurationValue(TerminalChatAgentToolsSettingId.PreventShellHistory, true);
	terminalSandboxService.wrapCommand = command => `sandbox:${command}`;

	const preparedInvocation = await executeToolTest({ command: 'echo hello' });
	const terminalData = preparedInvocation.toolSpecificData as IChatTerminalToolInvocationData;

	strictEqual(terminalData.commandLine.isSandboxWrapped, true);
	strictEqual(terminalData.commandLine.toolEdited, ' sandbox:echo hello');
});
```

### Option B: Comprehensive Fix (Optional)

Keep the current rewriter order, but teach `CommandLineSandboxRewriter` or `TerminalSandboxService.wrapCommand(...)` to preserve history-suppression whitespace outside the wrapper. For example, detect a leading space on `options.commandLine`, strip it from the inner command, and reapply it to the outer wrapped command.

This would also fix the bug, but it couples sandbox rewriting to one specific cosmetic rewrite. The pipeline already has an explicit history-prevention rewriter, so making that rewriter run last is the cleaner fix.

## Confidence Level: High

## Reasoning

- The shell-side behavior is explicit in the shell integration scripts: bash/zsh only suppress history when the command submitted to the shell begins with a space.
- `CommandLinePreventHistoryRewriter` exists specifically to add that leading space.
- `CommandLineSandboxRewriter` currently wraps the already-prefixed command into a quoted `-c` argument, which removes the leading space from the start of the final shell-visible command.
- That exactly matches the issue report: only sandboxed commands end up in shell history.
- Downstream output stripping should continue to work because `stripCommandEchoAndPrompt(...)` trims the command line before matching echoed commands, so a leading space on the final sandbox wrapper should not break output parsing.