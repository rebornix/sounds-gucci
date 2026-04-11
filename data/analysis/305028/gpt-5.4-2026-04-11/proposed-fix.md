# Bug Analysis: Issue #305028

## Understanding the Bug

This issue is a follow-up report rather than a standalone repro. The description only says "Related: #303712, #303118. But for Windows + Copilot CLI," and a bot comment links the already-merged fixing PR, so the issue is retrospective and light on reproduction details.

The symptom is still clear: in VS Code on Windows, when focus is inside a Copilot CLI terminal session, `Ctrl+=` and `Ctrl+-` do not trigger the workbench zoom commands.

## Git History Analysis

The first 24 hours of history before the parent commit did not show anything obviously related. Expanding to 3 days still did not reveal a relevant change. Expanding to 7 days found one commit that matches the issue description directly:

- `7b17c65f78d` - `Fix non-hardcoded meta commands not working with kitty keyboard, Fish (#303712)`

That commit changed `src/vs/workbench/contrib/terminal/browser/terminalInstance.ts` so the terminal's custom key event handler intercepts commands before xterm.js when `event.metaKey` is set. The commit message explains why: when kitty keyboard reporting is active, xterm.js encodes the key and calls `preventDefault`, so the normal workbench command never gets a chance to run.

The same commit added a regression test in `src/vs/workbench/contrib/terminal/test/browser/terminalInstance.test.ts` that simulates `workbench.action.zoomIn` resolving from a Meta-modified key. The test comments explicitly call out that `workbench.action.zoomIn` is not part of `DEFAULT_COMMANDS_TO_SKIP_SHELL`, so only the special `event.metaKey` path can save it.

That leaves a gap on Windows: the zoom commands are `Ctrl`-based there, not `Meta`-based.

### Time Window Used

- Initial: 24 hours
- Final: 7 days (expanded twice)

## Root Cause

The terminal interception logic added in #303712 only bypasses xterm.js for commands in `commandsToSkipShell` and for `Meta`-modified shortcuts. On Windows, `workbench.action.zoomIn` and `workbench.action.zoomOut` resolve from `Ctrl+=` and `Ctrl+-`, and those commands are not in `DEFAULT_COMMANDS_TO_SKIP_SHELL`, so a Copilot CLI terminal that enables kitty keyboard reporting still lets xterm.js consume the event before the workbench zoom command executes.

## Proposed Fix

### Option A: Targeted Fix (Recommended)

**Affected Files:**

- `src/vs/workbench/contrib/terminal/browser/terminalInstance.ts`
- `src/vs/workbench/contrib/terminal/test/browser/terminalInstance.test.ts`

**Changes Required:**

Extend the custom key event handler in `TerminalInstance` so it also bypasses xterm.js for the Windows `Ctrl`-based zoom commands.

Concretely:

1. Keep the current `event.metaKey` workaround from #303712 unchanged.
2. Add a narrow Windows-specific branch for resolved commands `workbench.action.zoomIn` and `workbench.action.zoomOut` when `event.ctrlKey` is true.
3. Add regression coverage that mirrors the existing Meta test but uses Windows-style `Ctrl` zoom shortcuts.

This keeps the fix small and targeted to the reported failure mode, without rerouting arbitrary `Ctrl` shortcuts away from the shell.

**Code Sketch:**

```ts
const isWindowsZoomCommand = isWindows
	&& event.ctrlKey
	&& (resolveResult.commandId === 'workbench.action.zoomIn'
		|| resolveResult.commandId === 'workbench.action.zoomOut');

if (
	!this._terminalConfigurationService.config.sendKeybindingsToShell &&
	resolveResult.kind === ResultKind.KbFound &&
	resolveResult.commandId &&
	(
		event.metaKey ||
		isWindowsZoomCommand ||
		this._skipTerminalCommands.some(command => command === resolveResult.commandId)
	)
) {
	event.preventDefault();
	return false;
}
```

**Test Sketch:**

```ts
test('custom key event handler should intercept Ctrl zoom commands on Windows when sendKeybindingsToShell is disabled', async () => {
	const instance = await createTerminalInstance();
	const keybindingService = instance['_keybindingService'];
	const originalSoftDispatch = keybindingService.softDispatch;
	keybindingService.softDispatch = () => ({
		kind: ResultKind.KbFound,
		commandId: 'workbench.action.zoomIn',
		commandArgs: undefined,
		isBubble: false
	});

	let capturedHandler: ((e: KeyboardEvent) => boolean) | undefined;
	instance.xterm!.raw.attachCustomKeyEventHandler = handler => { capturedHandler = handler; };
	const container = document.createElement('div');
	document.body.appendChild(container);
	instance.attachToElement(container);
	instance.setVisible(true);

	const event = new KeyboardEvent('keydown', { key: '=', ctrlKey: true, cancelable: true });
	try {
		deepStrictEqual(
			{ result: capturedHandler?.(event), defaultPrevented: event.defaultPrevented },
			{ result: false, defaultPrevented: true }
		);
	} finally {
		keybindingService.softDispatch = originalSoftDispatch;
		container.remove();
	}
});
```

### Option B: Broader Command Allowlist for Kitty Keyboard

Instead of special-casing just zoom, introduce a small helper that identifies workbench-level commands that should always escape xterm.js when kitty keyboard handling would otherwise swallow them.

This could make future follow-up fixes easier, but it is riskier because Windows `Ctrl` shortcuts are far more likely than macOS `Meta` shortcuts to overlap with valid terminal input. Without a reliable signal that kitty keyboard reporting is currently active, the broader allowlist could steal intended shell shortcuts.

## Confidence Level: Medium

## Reasoning

The issue explicitly points back to #303712, and the code added there matches the symptom closely: a workaround was introduced for kitty keyboard interception, but it only covered `Meta`-modified commands. The regression test from that earlier fix also uses `zoomIn`, which makes the gap easy to see because `zoomIn`/`zoomOut` are not part of `DEFAULT_COMMANDS_TO_SKIP_SHELL`.

Given that Windows zoom shortcuts are `Ctrl`-based, the most plausible failure is that the same kitty keyboard interception is happening in Copilot CLI sessions, but the new bypass never fires because `event.metaKey` is false. A narrow Windows-specific bypass for the resolved zoom commands should let the workbench command execute while minimizing behavioral changes for other terminal shortcuts.