# PR #303859: Fix command rewriting issues when terminal sandboxing is enabled

**Repository:** microsoft/vscode
**Labels:** 
**Merge Commit:** `3460bdb15c72c1586ba5d74ce1e91df179e74215`
**Parent Commit:** `ca117fbb4f0a60c2bcd03bdf5db2bf4e037a4e9e`

## Description

## Summary

Fixes two issues with sandboxed terminal commands, plus a pre-existing bash shell integration bug exposed by the fix.

### 1. Sandboxed commands end up in shell history (#303769)

The `PreventHistoryRewriter` (which prepends a space to exclude commands from history) was running **before** `SandboxRewriter`. The space was applied to the inner command, but the outer sandbox wrapper didn't get one — so the final command sent to the terminal had no leading space and ended up in shell history.

**Fix**: Moved `PreventHistoryRewriter` to run last in the rewriter chain, after sandbox wrapping.

### 2. `cd CWD && ` prefix not stripped in sandbox mode (#303848)

`SandboxedCommandLinePresenter` was using `options.commandLine.original` (the raw un-rewritten command) for display, bypassing all rewriter transformations including cd prefix stripping done by `CommandLineCdPrefixRewriter`.

**Fix**: Changed to use `options.commandLine.forDisplay`, which already has the cd prefix stripped.

### 3. `forDisplay` clobbered by later rewriters

The rewriter loop unconditionally overwrote `forDisplayCommand` on each rewrite result. When `PreventHistoryRewriter` ran after `SandboxRewriter` without setting `forDisplay`, it cleared the sandbox's display value, causing the raw sandbox command to show in the UI.

**Fix**: Changed to `rewriteResult.forDisplay ?? forDisplayCommand` — only update when explicitly provided.

### 4. Bash shell integration: exit codes missing with `HISTCONTROL=ignorespace`

When `VSCODE_PREVENT_SHELL_HISTORY=1` is set (all tool terminals), the bash shell integration script sets `HISTCONTROL="ignorespace"` (line 67). But the `__vsc_regex_histcontrol` regex (line 200) only checked for `erasedups|ignoreboth|ignoredups` — missing `ignorespace`. This caused `__vsc_preexec` to use `history 1` to capture the command, but space-prefixed commands aren't in history with `ignorespace`, so `__vsc_current_command` was wrong/empty. This caused `__vsc_command_complete` to send `633;D` without an exit code, breaking exit code detection for all tool terminal commands on bash.

fyi @Tyriar @meganrogge 

**Fix**: Added `ignorespace` to the regex. This is consistent — `ignoreboth` (already in the regex) is defined by bash as `ignorespace + ignoredups`.

### 5. Improved CI diagnostics

- Upgraded strategy selection and completion logs to `info` level in `runInTerminalTool.ts`
- In `richExecuteStrategy`, log at `info` when running in CI (`isCI`) and `debug` otherwise — this reveals which race winner resolved command completion (`onCommandFinished` vs idle prompt) and whether exit codes were captured

### 6. New `fix-ci-failures` skill

Added `.github/skills/fix-ci-failures/SKILL.md` — a skill that guides agents through diagnosing and fixing CI failures on a PR using the `gh` CLI. Includes:
- Added **Option C** (per-job API log download) — works while the run is still in progress, unlike `--log-failed` which requires the full run to complete
- Added `##[error]` grep-first strategy for fastest path to the failure cause
- Added Electron CDN 502 to the known infrastructure failure patterns
- Noted that log artifacts may be empty when the test runner crashes before producing output

Fixes #303769
Fixes #303848

## Commits

- fix: command rewriting issues when terminal sandboxing is enabled
- Merge remote-tracking branch 'origin/main' into fix/sandbox-command-r…
- update doc comment for SandboxedCommandLinePresenter
- improve execute strategy logging for CI diagnostics
- fix: include ignorespace in bash shell integration history verification
- docs: improve fix-ci-failures skill with faster log retrieval workflow

## Changed Files

- .github/skills/fix-ci-failures/SKILL.md
- extensions/vscode-api-tests/src/singlefolder-tests/chat.runInTerminal.test.ts
- src/vs/workbench/contrib/terminal/common/scripts/shellIntegration-bash.sh
- src/vs/workbench/contrib/terminalContrib/chatAgentTools/browser/executeStrategy/richExecuteStrategy.ts
- src/vs/workbench/contrib/terminalContrib/chatAgentTools/browser/tools/commandLinePresenter/sandboxedCommandLinePresenter.ts
- src/vs/workbench/contrib/terminalContrib/chatAgentTools/browser/tools/commandLineRewriter/commandLineSandboxRewriter.ts
- src/vs/workbench/contrib/terminalContrib/chatAgentTools/browser/tools/runInTerminalTool.ts
- src/vs/workbench/contrib/terminalContrib/chatAgentTools/test/browser/sandboxedCommandLinePresenter.test.ts
