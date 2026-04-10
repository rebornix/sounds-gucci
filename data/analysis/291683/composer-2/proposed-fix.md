# Proposed fix: Chat Sessions — toggling filter collapses “More” (#291544)

## Root cause

In `agentSessionsControl.ts`, `AgentSessionsFilter.onDidChange` runs `updateSectionCollapseStates()` before `list.updateChildren()` whenever **any** filter toggle changes (providers, status, **Archived**, **Read**, reset, etc.).

`updateSectionCollapseStates()` walks top-level section nodes and synchronizes collapse state. For `AgentSessionSection.More`, the logic is:

- Collapse “More” when the find widget is closed and the filter is **not** “only unread” (`!getExcludes().read` with default `read: false` → treat as “collapse More”).

That is appropriate as a **default** when the **read** filter changes, but when the user toggles **Archived** (or other unrelated excludes), `read` does not change — yet the handler still runs the `More` branch and **forces collapse** whenever `shouldCollapseMore` is true. If the user had expanded “More”, that collapses it again.

So the bug: **unrelated filter changes re-apply the default collapsed state for “More” and wipe manual expansion.**

## Files to change

- `src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsControl.ts`

(Related context only, no change required for this bug: `agentSessionsFilter.ts` defines `DEFAULT_EXCLUDES` and archived/read toggles; `agentSessionsViewer.ts` builds the “More” section in capped grouping.)

## Recommended fix

1. **Track the previous filter excludes** (or at least `read` and `archived`) on the control instance, initialized from `this.options.filter.getExcludes()` when the list is created.

2. In the `filter.onDidChange` handler, **after** the filter has updated storage, compute:
   - `readChanged = previous.read !== current.read`
   - `archivedChanged = previous.archived !== current.archived`
   - (Optionally compare full excludes if other dimensions should also avoid resetting sections.)

3. **Refine `updateSectionCollapseStates`** so that:
   - **`AgentSessionSection.More`**: only run the collapse/expand logic when `readChanged` is true **or** when this method is invoked from the find-widget path (see below). Do **not** collapse “More” when only `archived` (or provider/state) changed.
   - **`AgentSessionSection.Archived`**: only run when `archivedChanged` is true or when invoked from the find path (archived section uses `getExcludes().archived` for collapse).

4. **Find widget**: `onDidChangeFindOpenState` should continue to call `updateSectionCollapseStates()` in **full** mode (both sections), because find open/closed affects both `shouldCollapseMore` and `shouldCollapseArchived` via `!this.sessionsListFindIsOpen`.

   Easiest API: add an optional parameter, e.g. `updateSectionCollapseStates(options?: { syncMore?: boolean; syncArchived?: boolean })`, where omitted options mean “sync both” (current behavior). From `filter.onDidChange`, pass `{ syncMore: readChanged, syncArchived: archivedChanged }` and only enter each `case` when the corresponding flag is true **or** when syncing both for find.

5. At the end of the filter handler, assign `previousExcludes = this.options.filter.getExcludes()` (copy) for the next diff.

## Alternative (smaller but less precise)

Only gate the **More** section on `readChanged` (and find), since that matches the issue report (Archived toggle). Still compare previous/current excludes so archived-only changes do not touch “More.”

## Validation

- Expand “More” in Chat Sessions, toggle “Archived” in the filter menu → **“More” stays expanded.**
- Toggle “Read” filter (show only unread / show all) → **“More” collapse behavior still follows product rules** (expand when showing unread-only per existing logic).
- Open/close list find widget → **sections still expand while find is open** as today.
