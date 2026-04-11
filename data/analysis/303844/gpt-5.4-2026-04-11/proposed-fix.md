# Bug Analysis: Issue #303844

## Understanding the Bug

The issue reports that terminal command labels in chat show unnecessary markdown escape characters, for example `ls \-lh` instead of `ls -lh`. The repro is simple: ask the agent to run a command such as `ls -lh`, and the displayed label includes backslashes before punctuation. The reporter also notes this is a regression relative to 1.112, and that it happens both with and without sandboxing, which points away from execution logic and toward shared label-rendering code.

## Git History Analysis

The initial ancestry-based history search around the parent commit did not reveal a relevant regression in the last 24 hours, 3 days, or 7 days. The only commit in that window on the inspected ancestry slice was unrelated:

- `12e343fccb9` - `fix: exclude sandbox analyzer when sandbox rewriting is disabled (#303846)`
  - This changes confirmation behavior for sandbox rewriting, not terminal label formatting.

Because the issue clearly described a display regression, I traced the terminal command label pipeline instead:

- `src/vs/workbench/contrib/terminalContrib/chatAgentTools/browser/tools/runInTerminalTool.ts`
  - `handleToolStream()` already builds the streaming message with the raw truncated command and does not escape `-`.
  - `prepareToolInvocation()` builds the non-streaming invocation label and does escape the display command.

Strategic blame on the relevant lines in `runInTerminalTool.ts` identified the regression source:

- `99c4016d8e9c` - `when thinking is collapsed, make sure to show full tool info (#300952)`
  - This commit introduced `escapeMarkdownSyntaxTokens(displayCommand)` before interpolating the command into `Running `{0}``.
  - That change matches the issue symptom exactly and lines up with the reported regression period.

Subsequent changes on Mar 19 and Mar 21 threaded sandbox-specific variants through the same escaped display string, which explains why the problem appears in both sandboxed and unsandboxed cases.

### Time Window Used

- Initial: 24 hours
- Final: 168 hours (expanded 2 times)
- Result: no directly relevant ancestor commits in that 7-day window; root cause isolated by tracing the code path and blaming the suspect lines

## Root Cause

`prepareToolInvocation()` in `runInTerminalTool.ts` takes the already display-ready terminal command, runs it through `escapeMarkdownSyntaxTokens`, and then inserts that escaped string into an inline code span: `Running `{0}``.

That is the wrong escaping strategy for inline code. Markdown token escaping turns `ls -lh` into `ls \-lh`, and inside backticks that backslash is rendered literally instead of being interpreted as markdown syntax. The prepared invocation message is then reused as the visible tool label in the collapsed thinking/terminal UI, so the user sees `ls \-lh`.

## Proposed Fix

### Option A: Targeted Fix (Recommended)

**Affected Files:**

- `src/vs/workbench/contrib/terminalContrib/chatAgentTools/browser/tools/runInTerminalTool.ts`
- `src/vs/workbench/contrib/terminalContrib/chatAgentTools/test/electron-browser/runInTerminalTool.test.ts`

**Changes Required:**

- Stop calling `escapeMarkdownSyntaxTokens(displayCommand)` when constructing the terminal `invocationMessage` in `prepareToolInvocation()`.
- Keep the existing truncation and `forDisplay` logic, but interpolate the unescaped `displayCommand` into the localized inline-code message, matching the already-correct streaming path.
- Add a regression test that prepares a command like `ls -lh` and asserts the resulting `invocationMessage` contains `ls -lh`, not `ls \\-lh`.
- If desired, add a second test for a sandbox-wrapped path to verify the same formatting fix applies there too.

**Code Sketch:**

```ts
const rawDisplayCommand = toolSpecificData.commandLine.forDisplay
	?? toolSpecificData.commandLine.toolEdited
	?? toolSpecificData.commandLine.original;

const displayCommand = rawDisplayCommand.length > 80
	? rawDisplayCommand.substring(0, 77) + '...'
	: rawDisplayCommand;

const invocationMessage = toolSpecificData.commandLine.isSandboxWrapped
	? args.isBackground
		? new MarkdownString(localize('runInTerminal.invocation.sandbox.background', "Running `{0}` in sandbox in background", displayCommand))
		: new MarkdownString(localize('runInTerminal.invocation.sandbox', "Running `{0}` in sandbox", displayCommand))
	: args.isBackground
		? new MarkdownString(localize('runInTerminal.invocation.background', "Running `{0}` in background", displayCommand))
		: new MarkdownString(localize('runInTerminal.invocation', "Running `{0}`", displayCommand));
```

### Option B: Comprehensive Fix (Optional)

If the team wants to be robust against commands containing literal backticks, extract a tiny helper that formats an inline markdown code span safely by choosing an appropriate fence length, and use that helper in both `handleToolStream()` and `prepareToolInvocation()`.

Trade-off:

- Slightly more code and a small helper to maintain.
- Better long-term correctness than generic markdown escaping, which is correct for plain text but not for already-code-formatted content.

## Confidence Level: High

## Reasoning

The symptom maps directly to the code. `escapeMarkdownSyntaxTokens('ls -lh')` produces `ls \-lh`, and that escaped string is then rendered inside backticks, which makes the backslash visible. The same file already contains a neighboring code path (`handleToolStream()`) that does not escape the command and therefore shows the intended label. That makes the fix narrow, low-risk, and well supported by the issue report.