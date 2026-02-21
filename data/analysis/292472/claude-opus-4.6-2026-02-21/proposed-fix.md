# Bug Analysis: Issue #291701

## Understanding the Bug

The agent session list in VS Code's chat agents view collapses automatically without any user interaction. In the video linked in the issue, sections collapse between 0:20 and 0:30 on their own.

Two error messages accompany the behavior:
1. `TypeError: Cannot read properties of undefined (reading 'layout')` — in `ChatListRenderer.layout`
2. `Measuring item node that is not in DOM! Add ListView to the DOM before measuring row height!` — from the ListView/tree widget

The maintainer @bpasero identified the root cause: calling `List.updateChildren` many times without awaiting the previous call creates a race condition in the tree widget. This can cause the tree to reinitialize sections (including collapse state) while a previous update is still in progress, effectively resetting the UI.

## Git History Analysis

### Time Window Used
- Initial: 24 hours
- Final: 24 hours (no expansion needed)

The parent commit (`df57568c748f`) is from 2026-02-03. The issue was filed on 2026-01-29, and the maintainer confirmed reproducibility on 2026-02-03. The bug appears to be a long-standing race condition in the `AgentSessionsControl` rather than a recent regression.

## Root Cause

In `src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsControl.ts`, the method `list.updateChildren()` is called in multiple event handlers **without awaiting** the returned Promise:

1. **Line 182** — `this.options.filter.onDidChange` handler: `list.updateChildren()` (fire-and-forget)
2. **Line 187** — `model.onDidChangeSessions` handler: `list.updateChildren()` (fire-and-forget)
3. **Line 361** — `setVisible(true)`: `this.sessionsList?.updateChildren()` (fire-and-forget)

When multiple events fire in quick succession (e.g., triggering a local chat from the welcome view fires both a model change and a visibility change), concurrent `updateChildren()` calls race against each other. The `AsyncDataTree.updateChildren()` method rebuilds the tree's internal state. When two rebuilds overlap:
- The second call may start before the first finishes rendering
- This causes the tree to measure nodes not yet in the DOM (the second error message)
- The `collapseByDefault` callback is invoked during rebuilding, which may reset section collapse states
- The tree widget throws during layout because internal references become undefined (the first error message)

## Proposed Fix

### Option A: Targeted Fix (Recommended)

**Affected Files:**
- `src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsControl.ts`

**Changes Required:**
1. Import `Throttler` from `'../../../../../base/common/async.js'`
2. Add an `updateChildrenThrottler` field to the `AgentSessionsControl` class
3. Route all `updateChildren()` calls through the throttler
4. Register the throttler for disposal

This follows the exact same pattern used in `scmViewPane.ts` (line 2253) and `scmRepositoriesViewPane.ts` (line 435) which have the identical problem with concurrent `updateChildren()` calls.

**Code Sketch:**

```typescript
// Add import
import { Throttler } from '../../../../../base/common/async.js';

export class AgentSessionsControl extends Disposable implements IAgentSessionsControl {

    // ... existing fields ...

    // Add throttler field
    private readonly updateChildrenThrottler = this._register(new Throttler());

    // ... constructor and other methods ...

    private createList(container: HTMLElement): void {
        // ... existing setup code ...

        this._register(this.options.filter.onDidChange(async () => {
            if (this.visible) {
                this.updateSectionCollapseStates();
                this.updateChildren();  // <-- use throttled wrapper
            }
        }));

        this._register(model.onDidChangeSessions(() => {
            if (this.visible) {
                this.updateChildren();  // <-- use throttled wrapper
            }
        }));

        // ... rest of createList ...
    }

    // New private method to throttle updateChildren calls
    private updateChildren(): void {
        this.updateChildrenThrottler.queue(
            () => this.sessionsList?.updateChildren() ?? Promise.resolve()
        );
    }

    async update(): Promise<void> {
        await this.updateChildren();  // <-- use throttled wrapper
    }

    setVisible(visible: boolean): void {
        if (this.visible === visible) {
            return;
        }

        this.visible = visible;

        if (this.visible) {
            this.updateChildren();  // <-- use throttled wrapper
        }
    }

    // ... rest of class ...
}
```

The `Throttler` ensures that:
- If `updateChildren()` is already running, the next call is queued
- If multiple calls come in while one is active, only the last one actually runs after the current one completes
- This prevents concurrent tree rebuilds and the associated race conditions

## Confidence Level: High

## Reasoning

1. **Maintainer confirmation**: @bpasero explicitly stated: "Looks like calling `List.updateChildren` many times without waiting for the call to finish causes this. [...] I am pushing a fix to run multiple `updateChildren` calls through a `Throttler`." This directly describes the fix I'm proposing.

2. **Established pattern**: The exact same `updateChildrenThrottler` pattern exists in `scmViewPane.ts` (line 2253), `scmRepositoriesViewPane.ts` (line 435), and `scmHistoryViewPane.ts` (line 1645) — all tree-based views that experienced similar concurrent update issues.

3. **Only 1 file changed**: The metadata confirms `fileCount: 1`, consistent with this being a self-contained fix in `agentSessionsControl.ts`.

4. **Symptom match**: The race condition explains both error messages — nodes measured before they're in the DOM (concurrent rebuild), and undefined layout references (stale internal state from an overtaken update). Throttling prevents overlapping updates, eliminating both symptoms.

5. **Mental trace**: When a chat is triggered from the welcome view, `model.onDidChangeSessions` and `setVisible(true)` fire in quick succession. Without the throttler, two `updateChildren()` calls race. With the throttler, the second call waits for the first to complete, then runs cleanly — sections maintain their user-set collapse states.
