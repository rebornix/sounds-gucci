# Bug Analysis: Issue #304025

## Understanding the Bug
The chat customization view shows a shortened secondary description for customizations such as custom agents. In the reported repro, a sub-agent description containing `.github/agents/` is cut off because the UI code tries to derive a "first sentence" and treats the `.` in `.github` as a sentence terminator.

The expected behavior is to show the full description text up to the first line break and let the existing UI layout handle width-based truncation with ellipsis. This avoids locale-sensitive sentence parsing and preserves descriptions that contain punctuation, paths, abbreviations, or multiple clauses on a single line.

## Git History Analysis
The required incremental history scan around the parent commit did not show a nearby regression in the last 24 hours, 3 days, or 7 days.

- `95900913928` `Flatten sandbox network settings (#304270)`
  - This is the parent commit itself and is unrelated to chat customizations.

Since the bounded time window did not expose a likely introducer, I used file history and blame on the suspect code.

- `06f181c291f` `customizations: fix hook secondary text being truncated (#300614)`
  - This introduced `getCustomizationSecondaryText(...)` and kept full text only for hooks.
  - All other customization descriptions still flow through `truncateToFirstSentence(...)`.
- `b1009c98bb42`
  - The agent list path already passes the parsed `agent.description` through unchanged when building list items.
  - That means the bug is in display formatting, not in agent discovery or frontmatter parsing.

### Time Window Used
- Initial: 24 hours
- Final: 168 hours (expanded 2 times)

## Root Cause
`getCustomizationSecondaryText(...)` in `src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationListWidgetUtils.ts` applies `truncateToFirstSentence(...)` to non-hook descriptions. That helper uses a punctuation-based regex (`/^[^.!?]*[.!?]/`), so ordinary dots inside file paths or abbreviations are treated as sentence boundaries. As a result, agent descriptions like `Test agent from .github/agents/ ...` are truncated long before the actual end of the line.

## Proposed Fix

### Option A: Targeted Fix (Recommended)
**Affected Files:**
- `src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationListWidgetUtils.ts`
- `src/vs/workbench/contrib/chat/test/browser/aiCustomization/aiCustomizationListWidget.test.ts`

**Changes Required:**
Replace sentence-based truncation for customization secondary text with first-line extraction for normal descriptions, while keeping the existing hook exception if desired. The list item's CSS already applies `overflow: hidden`, `white-space: nowrap`, and `text-overflow: ellipsis`, so the code does not need to guess where a sentence ends or append its own ellipsis.

Concretely:
- Add a helper that returns the first logical line of the description, for example via `splitLines(description)[0]`.
- Update `getCustomizationSecondaryText(...)` to return:
  - `filename` when there is no description
  - the full hook description for `PromptsType.hook` if that behavior should remain unchanged
  - otherwise, the first line of the description rather than the first sentence
- Update the existing unit tests to cover:
  - an agent description containing `.github/agents/` and punctuation on the same line
  - a multiline description where only the first line should be shown
  - the existing hook behavior and filename fallback

**Code Sketch:**
```ts
import { splitLines } from '../../../../../base/common/strings.js';

export function getFirstDescriptionLine(text: string): string {
	return splitLines(text)[0] ?? text;
}

export function getCustomizationSecondaryText(description: string | undefined, filename: string, promptType: PromptsType): string {
	if (!description) {
		return filename;
	}

	if (promptType === PromptsType.hook) {
		return description;
	}

	return getFirstDescriptionLine(description);
}
```

### Option B: Comprehensive Fix (Optional)
Audit the other customization list widgets that still import `truncateToFirstSentence(...)`, especially the plugin and MCP list widgets, and switch them to the same first-line strategy or a shared "display description" helper. This is broader than necessary for the reported bug, but it would remove the same punctuation-sensitive behavior from adjacent customization UIs.

## Confidence Level: High

## Reasoning
The repro matches the implementation very closely: the reported description contains a dot in `.github/agents/`, and the current regex stops at the first `.` or `!` or `?`. The agent item creation path already provides the full `agent.description`, so the data is present before rendering. The CSS for `.item-description` already performs width-based ellipsis, which means the safest fix is to stop doing sentence heuristics in code and instead keep the full first line.

This change is minimal, localized, and directly addresses the symptom the issue describes. It also avoids false sentence boundaries for non-English text, abbreviations, commands, and paths without requiring a more complex locale-aware sentence parser.