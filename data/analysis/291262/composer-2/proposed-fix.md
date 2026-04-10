# Bug Analysis: Issue #290873

## Understanding the Bug

In **stacked** agent sessions view, using the **unread** filter (exclude read sessions via `IAgentSessionsFilterExcludes.read`) makes it hard to see that filtering worked: the **More** section collapses when the filter changes, so users only see a different count on the **More** row instead of the filtered list. Maintainers agreed the **More** section should **auto-expand** when this filter is applied because it is prominent from the title control.

A follow-up report: after expanding **More** and then applying the filter, the filter sometimes **turns off by itself** (not an intentional second click). That may share root cause with auto-restore logic elsewhere or be a separate race; primary scope below is expansion behavior.

## Git History Analysis

Searched `git log` in a 3-day window ending at parent `1bf610daabec2beeaa632dc1e33d92f21df41237`; no additional session-view commits in that slice beyond the parent itself. The relevant logic is stable in `agentSessionsControl.ts` (section collapse handling).

### Time Window Used

- Initial: 24 hours  
- Final: 3 days (expanded once)

## Root Cause

`AgentSessionsControl` builds the sessions tree with `collapseByDefault` returning **true** for `AgentSessionSection.More`, so **More** starts collapsed.

On **every** filter change, `options.filter.onDidChange` runs `updateSectionCollapseStates()` then `list.updateChildren()`.

For **More**, `updateSectionCollapseStates()` uses:

`shouldCollapseMore = !this.sessionsListFindIsOpen`

So whenever the in-tree **find** widget is closed, **More** is forced **collapsed**. That runs after applying the unread filter from the funnel or synced storage—wiping a user expansion and matching “filtering resets the more expansion.”

The **Archived** section already keys off `getExcludes().archived`; **More** does not consider the **read** (unread-only) filter, which is exactly the case @bpasero called out for auto-expand.

## Proposed Fix

### Option A: Targeted Fix (Recommended)

**Affected Files:**

- `src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsControl.ts`

**Changes Required:**

1. **`collapseByDefault` (More branch):** Treat **More** like a conditional section: default to **collapsed** unless the filter excludes read sessions (`getExcludes().read === true`), in which case default to **expanded** so first paint after toggling unread-only shows contents under **More** without an extra click.

2. **`updateSectionCollapseStates` (`AgentSessionSection.More` case):** Replace `shouldCollapseMore = !this.sessionsListFindIsOpen` with logic that also keeps **More** **expanded** when `this.options.filter.getExcludes().read === true` (still always expanding when find is open, matching the existing find-widget behavior).

Aligns with maintainer intent: auto-expand for the **unread** filter only, without changing behavior for other filter combinations unless you later broaden the condition.

**Code Sketch:**

```typescript
// In collapseByDefault, for AgentSessionSection.More:
// Collapse by default unless unread-only filter is active OR find is handling expansion via updateSectionCollapseStates
if (element.section === AgentSessionSection.More) {
	return !this.options.filter.getExcludes().read;
}

// In updateSectionCollapseStates, case AgentSessionSection.More:
const excludes = this.options.filter.getExcludes();
const shouldCollapseMore =
	!this.sessionsListFindIsOpen &&
	!excludes.read;
```

### Option B: Comprehensive Fix (Optional)

- Broaden auto-expand to **any non-default filter** (`!this.options.filter.isDefault()`) so provider/state tweaks also keep **More** visible. Heavier UX change; maintainer comments scoped to unread.

- For the **filter turns off** symptom: audit `agentTitleBarStatusWidget.ts` **`_clearFilterIfCategoryEmpty`** (restores previous filter when filtered category appears empty). If `hasUnreadSessions` can be false while unread sessions still exist (e.g. counting excludes sessions with an open editor widget), tighten the condition or the unread predicate so we do not restore/clear the unread filter spuriously.

## Confidence Level: High

## Reasoning

- The collapse logic for **More** is unconditional (except find), so any filter update collapses **More**—directly explaining stacked-view confusion when unread sessions live under **More**.
- `IAgentSessionsFilterExcludes.read === true` is the storage-backed “show unread only” state used by the Read toggle and title-bar unread flow; wiring **More** expansion to `read` matches @bpasero’s scoped fix.
- Mentally tracing: after the change, toggling unread applies `read: true`, `updateSectionCollapseStates` leaves **More** expanded, and `list.updateChildren()` no longer hides the filtered list behind a collapsed section.
