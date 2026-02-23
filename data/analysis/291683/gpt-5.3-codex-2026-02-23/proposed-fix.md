# Bug Analysis: Issue #291544

## Understanding the Bug
In Chat Sessions, if the user manually expands the `More` section and then toggles the filter option to show archived chats, the `More` section collapses unexpectedly.

Expected: toggling archived visibility should not reset the user’s expansion state for `More`.
Actual: `More` is auto-collapsed as a side effect of any filter change.

## Git History Analysis
Relevant evidence from the parent-commit code and blame:

- `9961a3a8b0a` (2026-01-28): **"In stacked view filtering resets the more expansion making filtering hard to see (fix #290873) (#291262)"**
  - This commit changed `agentSessionsControl.ts` to make `More` collapse depend on `!filter.getExcludes().read`.
  - It updated both `collapseByDefault` and `updateSectionCollapseStates`.
- Blame at parent commit `a72cd7b63e06...` shows lines in both places (`More` collapse logic) come from that commit.

Observed control flow at parent commit:

- `this.options.filter.onDidChange(...)` always calls `this.updateSectionCollapseStates(); list.updateChildren();`
- In `updateSectionCollapseStates()`:
  - `More` section uses:
    - `const shouldCollapseMore = !this.sessionsListFindIsOpen && !this.options.filter.getExcludes().read;`
  - Therefore, when archived filter is toggled (read filter unchanged), `shouldCollapseMore` is still evaluated and can force-collapse `More`.

This matches the reported symptom exactly.

### Time Window Used
- Initial: 24 hours
- Final: 24 hours (no expansion needed)

## Root Cause
`AgentSessionsControl` reapplies section collapse policy for `More` on **every** filter change, even when the change is unrelated to unread/read filtering.

Because `shouldCollapseMore` is derived from current filter state (`!excludes.read`), any unrelated toggle (e.g., archived visibility) can reset user-expanded state and collapse `More`.

## Proposed Fix

### Option A: Targeted Fix (Recommended)
**Affected Files:**
- `src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsControl.ts`

**Changes Required:**
- Track previous filter excludes snapshot in `AgentSessionsControl`.
- In `filter.onDidChange` handler:
  - Compare previous vs current excludes.
  - Only recompute/collapse `More` section when `read` exclusion changed (or when find-open state changes, which is already handled separately).
  - Keep existing update behavior for list contents (`updateChildren`) and archived section behavior.

This preserves user expansion of `More` when toggling archived chats.

**Code Sketch:**
```ts
// inside createList(...)
let previousExcludes = this.options.filter.getExcludes();

this._register(this.options.filter.onDidChange(async () => {
	const currentExcludes = this.options.filter.getExcludes();
	const didReadFilterChange = previousExcludes.read !== currentExcludes.read;
	const didArchivedFilterChange = previousExcludes.archived !== currentExcludes.archived;
	previousExcludes = currentExcludes;

	if (this.visible) {
		this.updateSectionCollapseStates({
			updateMore: didReadFilterChange,
			updateArchived: didArchivedFilterChange
		});
		list.updateChildren();
	}
}));

private updateSectionCollapseStates(options?: { updateMore?: boolean; updateArchived?: boolean }): void {
	...
	case AgentSessionSection.Archived:
		if (options?.updateArchived !== false) { /* existing archived logic */ }
		break;
	case AgentSessionSection.More:
		if (options?.updateMore !== false) { /* existing more logic */ }
		break;
}
```

Minimal variant if you want the smallest diff:
- In `onDidChange`, call `updateSectionCollapseStates()` only when `read` changed.
- Always keep `list.updateChildren()`.

### Option B: Comprehensive Fix (Optional)
Persist explicit per-section expansion state (especially for `More`) and only apply policy on first render/reset, not on every filter event. This is more robust UX-wise but larger scope than needed for the reported regression.

## Confidence Level: High

## Reasoning
- The issue reproducer maps directly to `filter.onDidChange` triggering `updateSectionCollapseStates`.
- The exact collapsing condition for `More` is independent of archived toggles but still re-evaluated during archived changes.
- Limiting `More` collapse recalculation to read-filter transitions removes the unintended side effect while preserving the original fix intent from #291262 (behavior when switching read/unread filter modes).
