# Bug Analysis: Issue #291544

## Understanding the Bug

**Summary:** In the Chat Sessions view (agent sessions), when the user expands the "More" section and then toggles a filter (e.g., choosing to show Archived chats), the "More" section collapses automatically, losing the user's manual expansion state.

**Steps to reproduce:**
1. In Chat Sessions, expand the "More" section
2. In the filter action, choose to show Archived chats
3. 🐛 "More" gets collapsed automatically

**Expected:** The "More" section should remain expanded when toggling an unrelated filter.

## Git History Analysis

### Time Window Used
- Initial: 24 hours
- Final: 24 hours (no expansion needed)

### Key Commit Found

Commit `9961a3a8b0a` (Jan 28, 2026) — *"In stacked view filtering resets the more expansion making filtering hard to see (fix #290873)"* — modified `updateSectionCollapseStates()` to also consider the `read` filter for the More section. This commit addressed a related but different scenario (filtering while in stacked view), but it didn't solve the underlying architectural issue: `updateSectionCollapseStates()` is called on **every** filter change and unconditionally re-evaluates and forces the collapse state of **all** sections.

## Root Cause

The `updateSectionCollapseStates()` method in `agentSessionsControl.ts` (lines 303-341) is called whenever **any** filter changes (via the `options.filter.onDidChange` handler on line 179). The method computes a `shouldCollapse` value for each section and forces the tree to match that value.

For the "More" section (lines 327-336):
```typescript
const shouldCollapseMore =
    !this.sessionsListFindIsOpen &&             // always expand when find is open
    !this.options.filter.getExcludes().read;     // always expand when only showing unread

if (shouldCollapseMore && !child.collapsed) {
    this.sessionsList.collapse(child.element);   // FORCES collapse
} else if (!shouldCollapseMore && child.collapsed) {
    this.sessionsList.expand(child.element);
}
```

When the "archived" filter is toggled, `onDidChange` fires, `updateSectionCollapseStates()` runs, and since the `read` filter hasn't changed (it's still `false`), `shouldCollapseMore` evaluates to `true`. If the user had manually expanded the More section, the condition `shouldCollapseMore && !child.collapsed` is true, and the section gets forcefully collapsed — even though the toggled filter (archived) has nothing to do with the More section.

The same issue also affects the **Archived** section in the reverse scenario: if the user manually expands/collapses the Archived section and then toggles the "read" filter, the Archived section's state could be overwritten.

## Proposed Fix

### Option A: Targeted Fix (Recommended)

Track the previous computed `shouldCollapse` state for each section. Only force a collapse/expand state change when the computed value **actually transitions** (e.g., from "should be collapsed" to "should be expanded"). This prevents filter changes that don't affect a section's relevance from overwriting the user's manual expansion.

**Affected Files:**
- `src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsControl.ts`

**Changes Required:**

1. Add two private fields to track previous collapse states
2. Initialize them after the tree is created (matching `collapseByDefault` logic)
3. In `updateSectionCollapseStates()`, wrap each section's collapse/expand logic in a guard that checks whether the computed `shouldCollapse` value has changed from its previous value

**Code Sketch:**

```typescript
// Add to class fields (around line 70):
private previousMoreShouldCollapse: boolean | undefined;
private previousArchivedShouldCollapse: boolean | undefined;

// In createList(), after the filter.onDidChange registration (after line 184),
// initialize the previous states to match the initial collapseByDefault behavior:
this.previousMoreShouldCollapse = !this.options.filter.getExcludes().read;
this.previousArchivedShouldCollapse = this.options.filter.getExcludes().archived;

// In updateSectionCollapseStates(), modify the Archived case (lines 315-326):
case AgentSessionSection.Archived: {
    const shouldCollapseArchived =
        !this.sessionsListFindIsOpen &&
        this.options.filter.getExcludes().archived;

    if (this.previousArchivedShouldCollapse !== shouldCollapseArchived) {
        this.previousArchivedShouldCollapse = shouldCollapseArchived;

        if (shouldCollapseArchived && !child.collapsed) {
            this.sessionsList.collapse(child.element);
        } else if (!shouldCollapseArchived && child.collapsed) {
            this.sessionsList.expand(child.element);
        }
    }
    break;
}

// In updateSectionCollapseStates(), modify the More case (lines 327-336):
case AgentSessionSection.More: {
    const shouldCollapseMore =
        !this.sessionsListFindIsOpen &&
        !this.options.filter.getExcludes().read;

    if (this.previousMoreShouldCollapse !== shouldCollapseMore) {
        this.previousMoreShouldCollapse = shouldCollapseMore;

        if (shouldCollapseMore && !child.collapsed) {
            this.sessionsList.collapse(child.element);
        } else if (!shouldCollapseMore && child.collapsed) {
            this.sessionsList.expand(child.element);
        }
    }
    break;
}
```

**How this fixes the bug (trace through the scenario):**

1. Tree initializes → More section is collapsed by `collapseByDefault`. `previousMoreShouldCollapse = true`.
2. User manually expands "More" → Tree internally sets `child.collapsed = false`. No call to `updateSectionCollapseStates()`, so `previousMoreShouldCollapse` stays `true`.
3. User toggles "archived" filter → `onDidChange` fires → `updateSectionCollapseStates()` runs:
   - `shouldCollapseMore = !false && !false = true` (find closed, read not excluded — unchanged)
   - `previousMoreShouldCollapse` is `true`, so `true !== true` → **false** → **skip** → More stays expanded ✓
4. User toggles "read" filter → `onDidChange` fires → `updateSectionCollapseStates()` runs:
   - `shouldCollapseMore = !false && !true = false` (read IS now excluded)
   - `previousMoreShouldCollapse` is `true`, so `true !== false` → **true** → expand if collapsed (correct behavior, since we want to show all when filtering to unread only) ✓

### Option B: Alternative — Pass change info through the event

Modify the `_onDidChange` emitter to carry information about which filter property changed, then use that in `updateSectionCollapseStates()` to only update the relevant section. This is a cleaner design but touches more files (the filter, the interface, and the control).

**Trade-offs:** More invasive change (modifying the `IAgentSessionsFilter` interface and `AgentSessionsFilter` class), but produces a more explicit contract. Not recommended given the simplicity of Option A.

## Confidence Level: High

## Reasoning

1. **Root cause is clear and verified:** The `updateSectionCollapseStates()` method forces collapse states for ALL sections on EVERY filter change, regardless of whether the change is relevant to the section. The commit `9961a3a8b0a` (fixing #290873) added the read-filter-aware logic for More but didn't address this fundamental issue.

2. **The fix is minimal and targeted:** Only `agentSessionsControl.ts` needs to change. The fix adds ~6 lines of state tracking that prevent unnecessary collapse/expand operations.

3. **No side effects:** The fix only prevents **unnecessary** state changes. All **necessary** state transitions (e.g., expanding More when switching to "unread only" mode, or expanding all sections when find widget opens) still work correctly because those transitions produce a different `shouldCollapse` value.

4. **Pattern is consistent:** Both the More and Archived sections get the same treatment, which is consistent with how the code already handles both symmetrically.
