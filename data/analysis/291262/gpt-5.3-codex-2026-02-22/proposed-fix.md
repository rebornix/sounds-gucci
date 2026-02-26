# Bug Analysis: Issue #290873

## Understanding the Bug
In the Agent Sessions stacked view, the unread filter is hard to perceive because the **More** section collapses when filters change. Repro from the issue:
1. Show sessions in stacked view
2. Enable unread filter
3. Expand **More**
4. Disable/enable filter again
5. **More** collapses again, so the filtered result is hard to inspect

Maintainer guidance in comments indicates intended behavior: when filtering to **Unread** (especially via title control), the user should see all relevant sessions (i.e., auto-expand instead of re-collapsing).

## Git History Analysis
I analyzed the codebase at parent commit `1bf610daabec2beeaa632dc1e33d92f21df41237` (pre-fix state) and inspected recent commit history around chat sessions files.

Relevant findings:
- `agentSessionsControl.ts` always collapses the **More** section unless find is open.
- On every filter change (`filter.onDidChange`), it re-applies section collapse logic, which collapses **More** again.
- `git blame` points this behavior to `3a95c41dac6` (new `agentSessionsControl.ts` introduction), where:
  - `shouldCollapseMore = !this.sessionsListFindIsOpen`
  - no special case for unread filter

This exactly matches the reported symptom.

### Time Window Used
- Initial: 24 hours
- Final: 168 hours (expanded 2 times)

## Root Cause
`src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsControl.ts` enforces collapsing of the **More** section on filter updates, with only one exception (find-open). There is no unread-filter exception, so toggling the unread filter resets the expansion and hides much of the filtered list.

## Proposed Fix

### Option A: Targeted Fix (Recommended)
**Affected Files:**
- `src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsControl.ts`

**Changes Required:**
- In `updateSectionCollapseStates()` for `AgentSessionSection.More`, treat unread-filter mode as an auto-expand condition.
- Keep current behavior for other states (default collapsed unless find is open).

Concretely:
- Read current excludes from `this.options.filter.getExcludes()`
- Detect unread filter mode via `excludes.read === true`
- Change collapse rule from:
  - collapse when `!sessionsListFindIsOpen`
- to:
  - collapse when `!sessionsListFindIsOpen && !isUnreadFilter`

This makes unread filtering immediately show the sessions in **More**, aligning with maintainer intent.

**Code Sketch:**
```ts
case AgentSessionSection.More: {
	const excludes = this.options.filter.getExcludes();
	const isUnreadFilter = excludes.read === true;
	const shouldCollapseMore = !this.sessionsListFindIsOpen && !isUnreadFilter;

	if (shouldCollapseMore && !child.collapsed) {
		this.sessionsList.collapse(child.element);
	} else if (!shouldCollapseMore && child.collapsed) {
		this.sessionsList.expand(child.element);
	}
	break;
}
```

### Option B: Comprehensive Fix (Optional)
If the “filter auto-turns off” report persists after Option A, harden title-badge filter restoration logic in:
- `src/vs/workbench/contrib/chat/browser/agentSessions/experiments/agentTitleBarStatusWidget.ts`

Specifically, avoid restoring previous filter during transient zero-count moments (e.g., while model/view is still refreshing). This is broader and should be done only if reproducible after the `More` auto-expand fix.

## Confidence Level: High

## Reasoning
- The issue symptom is directly explained by always-collapsing `More` on filter changes.
- Maintainer comment explicitly asks for auto-expand for this specific filter.
- The fix is minimal, localized to one file, and does not alter unrelated filtering behavior.
- It preserves existing UX rules (find-open behavior, archived behavior) while adding the missing unread-filter exception.