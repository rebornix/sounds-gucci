# Bug Analysis: Issue #303265

## Understanding the Bug
The issue reports that Copilot CLI terminal output appears truncated. The maintainer comment is the key signal: the output is not actually missing, and using the mouse wheel reveals the rest. That means the bug is in how the terminal output block is rendered or sized, not in how PTY output is collected. A later comment confirms the missing vertical scrollbar is a separate pre-existing issue, so the scope here is the truncated rendering itself.

## Git History Analysis
I inspected the repository at parent commit `e159670b493fad6494742543afa5c56ad6cca2e1` and checked the commit history in 24-hour, 3-day, and 7-day windows before that commit.

- The general history in those windows did not surface a recent terminal-output regression.
- File-specific history for the likely renderer files was also empty in that 7-day window, so this does not look like a same-week regression.
- `git blame` on the snapshot output path identified the relevant pre-fix implementation:
  - `src/vs/workbench/contrib/chat/browser/widget/chatContentParts/toolInvocationParts/chatTerminalToolProgressPart.ts` lays out the output block from `snapshot.lineCount` or the mirror's returned `lineCount`.
  - `src/vs/workbench/contrib/terminal/browser/chatTerminalCommandMirror.ts` contains `DetachedTerminalSnapshotMirror.render()`, which returns `output.lineCount ?? this._estimateLineCount(text)` after writing the VT snapshot into a detached terminal.

The important detail is that the snapshot renderer is replaying stored terminal text into a detached terminal with a fallback width of 80 columns, while still trusting line-count metadata captured from the original terminal.

### Time Window Used
- Initial: 24 hours
- Final: 168 hours (expanded 2 times)

## Root Cause
Snapshot output rendering relies on a serialized `terminalCommandOutput.lineCount` that reflects the original terminal's buffer rows or newline count, not the number of rows actually rendered in the detached snapshot terminal. When the stored VT output is replayed into `DetachedTerminalSnapshotMirror`, long lines can wrap differently at the detached terminal's width, creating more rendered rows than `snapshot.lineCount` reports. The chat output section then sizes the container from that stale count, so the block looks truncated even though the content is still present and scrollable.

## Proposed Fix

### Option A: Targeted Fix (Recommended)
**Affected Files:**
- `src/vs/workbench/contrib/terminal/browser/chatTerminalCommandMirror.ts`

**Changes Required:**
Update `DetachedTerminalSnapshotMirror.render()` so it computes `lineCount` from the detached terminal's actual rendered buffer after writing the snapshot text, instead of trusting `output.lineCount` or `_estimateLineCount(text)` for layout. Keep the serialized count only as a fallback before rendering succeeds.

That keeps the fix local to the snapshot renderer and addresses the exact mismatch that the issue describes: stored output is present, but the displayed height is too short because wrapped rows are undercounted.

**Code Sketch:**
```ts
private _computeRenderedLineCount(terminal: IDetachedTerminalInstance): number {
    const buffer = terminal.xterm.buffer.active;
    for (let y = buffer.length - 1; y >= 0; y--) {
        const line = buffer.getLine(y);
        if (!line) {
            continue;
        }

        const lineLength = Math.min(line.length, terminal.xterm.cols);
        for (let x = lineLength - 1; x >= 0; x--) {
            if (line.getCell(x)?.getChars()) {
                return y + 1;
            }
        }
    }

    return 0;
}

public async render(): Promise<{ lineCount?: number; maxColumnWidth?: number } | undefined> {
    ...
    await new Promise<void>(resolve => terminal.xterm.write(text, resolve));
    ...
    const lineCount = this._computeRenderedLineCount(terminal);
    this._lastRenderedLineCount = lineCount;
    if (this._shouldComputeMaxColumnWidth(lineCount)) {
        this._lastRenderedMaxColumnWidth = this._computeMaxColumnWidth(terminal);
    }
    return { lineCount, maxColumnWidth: this._lastRenderedMaxColumnWidth };
}
```

**Regression Test:**
Add coverage in `src/vs/workbench/contrib/terminal/test/browser/chatTerminalCommandMirror.test.ts` for a stored snapshot whose long lines fit in the source terminal but wrap in the detached snapshot mirror, and assert the returned `lineCount` matches the wrapped rendering rather than the original source line count.

### Option B: Comprehensive Fix (Optional)
If repeated expand/collapse cycles can re-layout from stale metadata, also update `src/vs/workbench/contrib/chat/browser/widget/chatContentParts/toolInvocationParts/chatTerminalToolProgressPart.ts` so the existing `_snapshotMirror` path uses the mirror's cached rendered result instead of `snapshot.lineCount` directly. I would treat that as a follow-up hardening step unless repro shows the stale re-expand path is user-visible.

## Confidence Level: High

## Reasoning
The issue comments rule out missing output and point directly to a rendering problem. The snapshot render path is the only place where terminal output is replayed into a detached terminal with a width that can differ from the original source terminal while layout still depends on serialized `lineCount`. That makes it the best explanation for why Copilot CLI output appears truncated but becomes visible when scrolled. Recomputing the line count from the detached terminal's rendered buffer fixes the root mismatch and stays within the already-established separation of concerns for live vs. snapshot terminal rendering.