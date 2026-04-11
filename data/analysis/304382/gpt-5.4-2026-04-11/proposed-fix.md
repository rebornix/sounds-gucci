# Bug Analysis: Issue #304382

## Understanding the Bug
Manual "Check for Updates" from the App menu is an explicit user command. On macOS, when no update exists, the app currently surfaces the new title-bar update affordance by programmatically opening its hover. The issue asks to restore modal feedback for this explicit command, rather than showing a hover without user interaction.

## Git History Analysis
A 24-hour, 3-day, and 7-day history scan around the parent commit did not show a nearby change in the update directories that explained the regression. Because the symptom clearly involved the new title-bar update UI, I traced the current parent-commit lines with `git blame` and inspected the introducing changes.

- `cfe3b3286e4` - `Update action for the title bar (#300453)`
  - Added `titleBarEnabled` gating across `src/vs/workbench/contrib/update/browser/update.ts`.
  - This change specifically made `onUpdateNotAvailable()` return early when the title-bar update UI is enabled, suppressing the old modal dialog.
- `f8932104a7c` - `Update title bar UI feature work and bug fixes (#301497)`
  - Added `UpdateTitleBarContribution.onStateChange()` logic that auto-opens the title-bar tooltip for `StateType.Idle` when `state.notAvailable` is set.
  - That turns the explicit "no updates" result into a hover opened without hover or click interaction.
- Service tracing at the parent commit confirms the macOS explicit-check path:
  - `src/vs/platform/menubar/electron-main/menubar.ts` calls `this.updateService.checkForUpdates(true)`.
  - `src/vs/platform/update/electron-main/updateService.darwin.ts` converts "no update available" into `State.Idle(UpdateType.Archive, undefined, true)` for explicit checks.
  - `src/vs/workbench/contrib/update/browser/update.ts` only shows the modal when `titleBarEnabled` is false.
  - `src/vs/workbench/contrib/update/browser/updateTitleBarEntry.ts` auto-opens the hover for `Idle.notAvailable`.

### Time Window Used
- Initial: 24 hours
- Final: 168 hours (expanded 2 times)
- Additional tracing: `git blame` on the parent-commit lines in the two suspect workbench files, because the relevant UI work predated the 7-day window.

## Root Cause
The explicit "check for updates" flow on macOS still marks the "no updates found" result correctly via `Idle.notAvailable`, but the workbench presentation layer now mishandles that signal in two places: the old modal dialog is suppressed whenever the title-bar update UI is enabled, and the new title-bar contribution auto-opens its hover for the same `notAvailable` state. The result is that a command-driven result is shown using passive hover UI.

## Proposed Fix

### Option A: Targeted Fix (Recommended)
**Affected Files:**
- `src/vs/workbench/contrib/update/browser/update.ts`
- `src/vs/workbench/contrib/update/browser/updateTitleBarEntry.ts`

**Changes Required:**
1. Restore modal feedback for explicit "no updates available" results in `UpdateContribution`.
   - Remove or narrow the `titleBarEnabled` early return inside `onUpdateNotAvailable()`.
   - Keep the dialog as the response to a manual update check, regardless of whether the title-bar affordance is enabled.
2. Stop auto-opening the title-bar hover for `Idle.notAvailable`.
   - In `UpdateTitleBarContribution.onStateChange()`, keep auto-opening for actual errors or actionable update states if desired, but do not treat `state.notAvailable` as a reason to programmatically show the hover.
3. Leave the service layer unchanged.
   - `updateService.darwin.ts` is already producing the correct transient state for explicit checks; the regression is purely in how the workbench consumes it.

**Code Sketch:**
```ts
// src/vs/workbench/contrib/update/browser/update.ts
private onUpdateNotAvailable(): void {
        this.dialogService.info(nls.localize('noUpdatesAvailable', "There are currently no updates available."));
}

// src/vs/workbench/contrib/update/browser/updateTitleBarEntry.ts
case StateType.Idle:
        showTooltip = !!this.state.error;
        break;
```

**Why this is the smallest correct fix:**
- It restores the previous explicit-command UX without undoing the broader title-bar update feature.
- It preserves the title-bar affordance as passive status UI instead of making it the response to a menu command.
- It matches the maintainer comment on the issue: "Will show a modal dialog as before instead of the tooltip."

### Option B: Comprehensive Fix (Optional)
Introduce a separate presentation signal for explicit update-command outcomes, such as a dedicated event or a richer result type than `Idle.notAvailable`, and route all command-driven completions through dialogs or notifications while keeping the title bar strictly passive. This is cleaner architecturally, but it is more invasive because it touches update state modeling and platform implementations instead of only fixing the UI regression.

## Confidence Level: High

## Reasoning
The call path is direct and internally consistent at the parent commit:

1. The App menu invokes `checkForUpdates(true)`.
2. The Darwin update service sets `Idle(..., notAvailable=true)` when no update exists.
3. The classic update contribution still contains the old modal dialog code, but it no longer runs when `update.titleBar` is enabled.
4. The title-bar contribution sees the same transient `notAvailable` flag and explicitly calls `showTooltip()`.

If the two workbench-layer changes above are made, the explicit manual check returns to the expected modal dialog and the title-bar UI goes back to acting as an affordance instead of an unsolicited hover. I would also add a focused workbench browser test that simulates `CheckingForUpdates(true) -> Idle(notAvailable=true)` with `update.titleBar` enabled and verifies that the dialog path runs while the title-bar entry does not auto-open its tooltip.