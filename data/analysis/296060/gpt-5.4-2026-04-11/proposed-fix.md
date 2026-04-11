# Bug Analysis: Issue #296060

## Understanding the Bug

The issue is about the compact chat input toolbar in the sidebar. Two visible symptoms are described:

- The selected model sometimes disappears entirely from the input toolbar until the sidebar is resized slightly.
- The tools button can move into a `...` overflow menu even when it is the only thing in that menu, which is poor UX and does not materially help.

The maintainer comments are useful here:

- They suspected a measurement/visibility problem at first.
- They specifically called out that the tool picker can end up alone in overflow because it is slightly wider than the overflow button.
- Later comments mention the behavior getting worse after recent responsive-toolbar changes.

The issue also references PR `#303780` in a later comment, so this issue is at least partially retrospective. I treated that only as a warning that the thread may contain post-fix hints, not as solution data.

## Git History Analysis

### Time Window Used

- Initial: 24 hours
- Expanded: 72 hours
- Final: 168 hours

The incremental history search around parent commit `38c26afe7466b57a9c97d31de7c575d5b8d575e8` did not show direct changes to the suspect chat input files inside the 24-hour, 3-day, or 7-day windows. The 24-hour window only surfaced the merge commit for the parent itself.

Because the narrow history window did not reveal the regression directly, I used `git blame` on the exact layout and CSS lines involved. That surfaced the earlier changes that matter:

- `0321be04fe71` - `Simplify chat input toolbar responsive behavior (#298467)`
  - Introduced `responsiveBehavior: { kind: 'last', minItems: 1, actionMinWidth: 22 }` for the chat input toolbar.
  - Added the CSS rule set that allows chat picker items to collapse aggressively and keeps icon-only collapsed pickers at `22px`.
  - Commit message explicitly says it collapses chat input picker buttons to `22x22` at narrow widths.

- `4eb8f169e584` - `Update chat input: hide attachments bar, move/restyle context window hint (#296390)`
  - Moved the context-usage widget into the toolbar area and tightened width budgeting for compact chat input.
  - This increases pressure on the same toolbar layout path.

- `db73eef8c4b6` - `fix quick chat input not showing label (#299750)`
  - Fixed a related compact-mode label visibility problem in quick chat by changing how compact toolbar/context-usage layout is handled.
  - This is strong evidence that the responsive chat toolbar had already been fragile in this exact area.

## Root Cause

The bug is caused by the interaction of three things in the compact chat input toolbar:

1. `ChatInputPart` configures the primary chat input toolbar with responsive behavior that only shrinks the last visible primary item, using an icon-sized minimum width of `22px`.
2. When the tools picker is present and is moved into the `...` overflow menu, the model picker becomes the new shrink target because the shared toolbar CSS makes the second-to-last item shrinkable once overflow exists.
3. The chat picker CSS allows label-bearing picker actions to collapse to `min-width: 0`, so the model picker's text can shrink away to a lone chevron or effectively nothing.

That is why the model label disappears specifically when the tools picker is showing next to it. The tools picker can be the single item that overflows, and once that happens the model picker is the item that gets squeezed. A slight resize changes the overflow decision and the model label reappears.

The earlier “measured while hidden” suspicion is understandable, but the code path at this parent commit points more strongly to a width-budgeting and shrink-floor mismatch than to a pure visibility-measurement bug.

## Proposed Fix

### Option A: Targeted Fix (Recommended)

**Affected Files:**

- `src/vs/workbench/contrib/chat/browser/widget/media/chat.css`
- `src/vs/workbench/contrib/chat/browser/widget/input/chatInputPart.ts`

**Changes Required:**

Make the minimum width for label-bearing chat pickers match reality instead of the generic icon-only `22px` floor.

- Keep the existing `22px` collapse behavior only for genuinely icon-only picker states.
- Give label-bearing pickers in the primary chat input toolbar a non-zero minimum width so the model name cannot collapse away completely.
- Align the chat toolbar's responsive minimum-width assumption with that picker minimum so overflow decisions are made against the same floor the CSS enforces.

This is the smallest fix that addresses the actual symptom without redesigning the shared toolbar.

**Code Sketch:**

```ts
// src/vs/workbench/contrib/chat/browser/widget/input/chatInputPart.ts
const readablePickerMinWidth = 48; // exact value should be the smallest acceptable truncated picker width

this.inputActionsToolbar = this._register(this.instantiationService.createInstance(
    MenuWorkbenchToolBar,
    toolbarsContainer,
    MenuId.ChatInput,
    {
        telemetrySource: this.options.menus.telemetrySource,
        menuOptions: { shouldForwardArgs: true },
        hiddenItemStrategy: HiddenItemStrategy.NoHide,
        hoverDelegate,
        responsiveBehavior: {
            enabled: true,
            kind: 'last',
            minItems: 1,
            actionMinWidth: readablePickerMinWidth
        },
        actionViewItemProvider: /* existing provider */
    }
));
```

```css
/* src/vs/workbench/contrib/chat/browser/widget/media/chat.css */

/* Do not let text-bearing pickers collapse to a lone chevron / invisible label. */
.interactive-session .chat-input-toolbar .chat-input-picker-item .action-label:has(.chat-input-picker-label) {
        min-width: 48px;
}

/* Keep the small 22px floor only for intentionally icon-only collapsed pickers. */
.interactive-session .chat-input-toolbar .chat-input-picker-item .action-label.hide-chevrons:not(:has(.chat-input-picker-label)),
.interactive-session .chat-input-toolbar .chat-input-picker-item.hide-chevrons .action-label:not(:has(.chat-input-picker-label)),
.interactive-session .chat-input-toolbar .chat-sessionPicker-item .action-label.hide-chevrons:not(:has(.chat-input-picker-label)) {
        min-width: 22px;
}
```

### Option B: Broader UX Fix

**Affected Files:**

- `src/vs/base/browser/ui/toolbar/toolbar.ts`
- `src/vs/workbench/contrib/chat/browser/widget/input/chatInputPart.ts`

Teach the responsive toolbar to avoid showing the overflow `...` menu when it would contain only a single hidden action, at least for this chat toolbar.

That would directly address the UX complaint from the issue and would also avoid turning the model picker into the shrink target in the common “model + tools” case.

**Trade-off:**

This is a broader shared-toolbar behavior change, so it carries more regression risk than the targeted CSS/min-width fix.

## Confidence Level: Medium

## Reasoning

I am moderately confident because the failure can be traced directly through the pre-fix code:

- `chatInputPart.ts` subtracts `inputActionsToolbar.getItemsWidth()` from the editor width in compact mode.
- The toolbar uses shared responsive behavior with `kind: 'last'` and `actionMinWidth: 22`.
- The shared toolbar CSS makes the last primary item, or the second-to-last item when overflow exists, the shrinkable item.
- The chat picker CSS explicitly sets picker and picker-label containers to `min-width: 0`.
- The model picker renderer always produces a text label, but it often has no leading icon, so once it becomes the shrink target it has no stable visible floor.

The history also lines up cleanly:

- The responsive simplification commit on 2026-03-02 introduced the `22px` shrink floor and picker-collapse behavior.
- A follow-up quick-chat fix on 2026-03-06 repaired a closely related symptom in compact chat, which suggests the same responsive layout path was already known to be brittle.

If I made the targeted fix above, I would expect the specific symptom in this issue to go away because the model picker would no longer be allowed to collapse beyond a readable width, even when the tools picker overflows.