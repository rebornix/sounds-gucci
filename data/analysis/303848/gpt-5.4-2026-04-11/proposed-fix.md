# Bug Analysis: Issue #303848

## Understanding the Bug

The issue is about display normalization for `run_in_terminal` commands. When a model proposes a command like `cd /Users/alex/src/vscode3 && ls -lh`, the tool normally strips the redundant `cd <cwd> &&` prefix if the target directory matches the terminal's current working directory, so the user sees just `ls -lh`.

That behavior works when terminal sandboxing is off, but with sandboxing enabled the user still sees the full `cd ... && ls -lh` command. The issue description and screenshot indicate this is a sandbox-only regression in how the command is presented back to the user, not a failure in parsing the `cd` prefix itself.

## Git History Analysis

### Time Window Used

- Initial: 24 hours
- Expanded: 72 hours
- Final: 168 hours

The recent ancestor history around the parent commit was effectively empty for this bug. The 24-hour, 3-day, and 7-day windows only surfaced the parent commit itself:

- `ca117fbb4f0` `Accept "Command produced no output" when shell integration is off (#303866)`

That commit is not related to sandboxed command presentation, so I traced the issue through suspect-file history and blame instead.

### Relevant File History

- `a4d32702fc1` `Adding commandLineRewriter to wrap commands with sandboxing args in sandboxed mode. (#289172)`

This older change introduced both:

- `src/vs/workbench/contrib/terminalContrib/chatAgentTools/browser/tools/commandLinePresenter/sandboxedCommandLinePresenter.ts`
- sandbox-specific command rewriting and presentation flow in `runInTerminalTool.ts`

Blame on `sandboxedCommandLinePresenter.ts` shows the current line was introduced there and never changed:

```ts
commandLine: options.commandLine.original ?? options.commandLine.forDisplay,
```

## Root Cause

The `CommandLineCdPrefixRewriter` already strips `cd <cwd> &&` correctly before sandbox wrapping happens.

In `runInTerminalTool.ts`, the rewritten display value is carried forward as `forDisplay`, and after `cd` extraction the presenter pipeline is invoked with:

```ts
{ commandLine: { original: args.command, forDisplay: presenterInput }, shell, os }
```

At that point `presenterInput` is already the cleaned-up display command, for example `ls -lh`.

However, `SandboxedCommandLinePresenter` prefers `original` over `forDisplay`:

```ts
commandLine: options.commandLine.original ?? options.commandLine.forDisplay,
```

So when sandboxing is enabled, the presenter restores the raw original command text and reintroduces the redundant `cd /Users/alex/src/vscode3 &&` prefix. That is why the bug only reproduces in sandbox mode.

## Proposed Fix

### Option A: Targeted Fix (Recommended)

**Affected Files:**

- `src/vs/workbench/contrib/terminalContrib/chatAgentTools/browser/tools/commandLinePresenter/sandboxedCommandLinePresenter.ts`
- `src/vs/workbench/contrib/terminalContrib/chatAgentTools/test/browser/sandboxedCommandLinePresenter.test.ts`

**Changes Required:**

Update `SandboxedCommandLinePresenter` to preserve the already-prepared display command when one exists, and only fall back to `original` if `forDisplay` is absent.

This keeps the presenter aligned with the rest of the pipeline:

- rewriters decide what the display form should be
- `cd` extraction further simplifies the display form
- the sandbox presenter preserves that simplified form instead of restoring the raw input

Add a regression test where both `original` and `forDisplay` are supplied and `forDisplay` has already removed the redundant `cd` prefix.

**Code Sketch:**

```ts
export class SandboxedCommandLinePresenter implements ICommandLinePresenter {
        async present(options: ICommandLinePresenterOptions): Promise<ICommandLinePresenterResult | undefined> {
                if (!(await this._sandboxService.isEnabled())) {
                        return undefined;
                }

                return {
                        commandLine: options.commandLine.forDisplay ?? options.commandLine.original,
                        processOtherPresenters: true
                };
        }
}
```

Regression test sketch:

```ts
test('should preserve rewritten display command when original is also present', async () => {
        const presenter = createPresenter();
        const result = await presenter.present({
                commandLine: {
                        original: 'cd /test/workspace && npm test',
                        forDisplay: 'npm test'
                },
                shell: 'bash',
                os: OperatingSystem.Linux
        });

        strictEqual(result?.commandLine, 'npm test');
});
```

### Option B: Comprehensive Fix (Optional)

In addition to the targeted presenter change, add an end-to-end regression in:

- `src/vs/workbench/contrib/terminalContrib/chatAgentTools/test/electron-browser/runInTerminalTool.test.ts`

Specifically, verify that when sandboxing is enabled and the input command is `cd <cwd> && <suffix>`, the resulting invocation message still shows only `<suffix>`.

This is not required to fix the bug, but it would protect the full orchestration path rather than only the presenter unit.

## Confidence Level: High

## Reasoning

The fix is high confidence because the data flow is explicit in the pre-fix code:

1. `CommandLineCdPrefixRewriter` strips redundant `cd` prefixes when `cwd` matches.
2. `runInTerminalTool.ts` builds a cleaned display command and even performs `cd` extraction before presenter overrides run.
3. `SandboxedCommandLinePresenter` then receives both the raw original command and the already-cleaned display value.
4. The presenter currently chooses `original` first, which exactly explains why sandbox mode alone restores the unwanted prefix.

Changing the precedence to `forDisplay ?? original` fixes the specific symptom at the narrowest point and preserves the intended sandbox behavior of hiding the wrapper command while still respecting earlier display rewrites.