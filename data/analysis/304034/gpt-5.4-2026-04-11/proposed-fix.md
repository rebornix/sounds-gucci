# Bug Analysis: Issue #304034

## Understanding the Bug
The reported problem is a UX gap in the new terminal sandbox bypass flow, not a failure of sandbox enforcement itself. When a command cannot run inside the sandbox, VS Code now asks the user to approve running it outside the sandbox, but the visible confirmation UI introduces "sandbox" as a new concept without any inline documentation link or short learn-more affordance.

The maintainer comments make the intended direction explicit:

- link to docs from the UI
- ideally make the sandbox reference clickable/underlined
- use the provided docs shortlink: `https://aka.ms/vscode-sandboxing`

## Git History Analysis
The initial repository-wide 24-hour and 3-day windows before parent commit `d5370dfd468f3d10216e5fb2fb5c8696fca6254f` did not isolate the relevant feature work, so I narrowed the investigation to the files involved in the terminal confirmation UI.

Relevant recent history:

- `bf817728424a` - `feat: add support for sandbox bypass in terminal commands with confirmation prompts`
  - Introduced the unsandbox confirmation title/message path in `src/vs/workbench/contrib/terminalContrib/chatAgentTools/browser/tools/runInTerminalTool.ts`.
- `1d47f2365bc0` - `Update src/vs/workbench/contrib/terminalContrib/chatAgentTools/browser/tools/runInTerminalTool.ts`
  - Tweaked the unsandbox confirmation wording to `Run ... outside the sandbox?`.
- `69fd6c626e6` - `Show unsandboxed execution reason in terminal tool confirmation (#304302)`
  - Added the visible reason block in `src/vs/workbench/contrib/chat/browser/widget/chatContentParts/toolInvocationParts/chatTerminalToolConfirmationSubPart.ts`.

What this history shows:

- the unsandbox prompt was added first in the tool layer
- a follow-up added the inline reason text in the chat confirmation widget
- neither change added a learn-more link, even though the visible UI now exposes the new sandbox concept directly to users

### Time Window Used
- Initial: 24 hours
- Expanded: 3 days
- Final: 7 days

The final 7-day window was necessary to connect the visible chat confirmation change (`69fd6c626e6`) back to the original terminal sandbox bypass prompt introduction (`bf817728424a`).

## Root Cause
The terminal unsandbox confirmation flow already produces markdown-capable confirmation data, but the visible UI only renders the inline disclaimer area, and unsandbox requests currently leave that disclaimer empty. As a result, users see a plain-text "outside the sandbox" prompt and the model's reason, but no clickable explanation of what sandboxing is.

## Proposed Fix

### Option A: Targeted Fix (Recommended)
Keep the renderer as-is and populate the existing inline disclaimer channel for unsandbox confirmations with a docs link.

**Affected Files:**
- `src/vs/workbench/contrib/terminalContrib/chatAgentTools/browser/tools/runInTerminalTool.ts`
- `src/vs/workbench/contrib/terminalContrib/chatAgentTools/test/electron-browser/runInTerminalTool.test.ts`

**Why this is the minimal fix:**
- `ChatTerminalToolConfirmationSubPart` already renders `confirmationMessages.disclaimer` as markdown
- that markdown path already supports clickable links
- the existing `runInTerminalTool.test.ts` suite already asserts unsandbox confirmation contents, so coverage can stay in the tool layer
- no widget or renderer refactor is needed

**Changes Required:**
1. Add a sandbox documentation URL constant, e.g. `https://aka.ms/vscode-sandboxing`.
2. In `runInTerminalTool.ts`, when `requiresUnsandboxConfirmation` is true, append a markdown disclaimer such as `Learn more about [sandboxing](https://aka.ms/vscode-sandboxing).` before `confirmationMessages` is returned.
3. Preserve existing analyzer disclaimers by adding the sandbox learn-more text to the same disclaimer aggregation path instead of replacing it.
4. Update the unsandbox confirmation unit test to assert that the disclaimer now exists and includes the sandbox docs link.

**Code Sketch:**
```ts
const SANDBOX_DOCUMENTATION_URL = 'https://aka.ms/vscode-sandboxing';

const disclaimersRaw = commandLineAnalyzerResults
	.map(e => e.disclaimers)
	.filter(e => !!e)
	.flatMap(e => e);

if (requiresUnsandboxConfirmation) {
	disclaimersRaw.push(new MarkdownString(localize(
		'runInTerminal.unsandboxed.learnMore',
		"Learn more about [sandboxing]({0}).",
		SANDBOX_DOCUMENTATION_URL
	)));
}

let disclaimer: IMarkdownString | undefined;
if (disclaimersRaw.length > 0) {
	const disclaimerTexts = disclaimersRaw.map(d => typeof d === 'string' ? d : d.value);
	const hasMarkdownDisclaimer = disclaimersRaw.some(d => typeof d !== 'string');
	const mdOptions = hasMarkdownDisclaimer
		? { supportThemeIcons: true, isTrusted: { enabledCommands: [TerminalChatCommandId.OpenTerminalSettingsLink] } }
		: { supportThemeIcons: true };

	disclaimer = new MarkdownString(`$(${Codicon.info.id}) ` + disclaimerTexts.join(' '), mdOptions);
}
```

**Test Sketch:**
```ts
const disclaimer = result?.confirmationMessages?.disclaimer;
ok(disclaimer && typeof disclaimer !== 'string');
ok(disclaimer.value.includes('https://aka.ms/vscode-sandboxing'));
```

### Option B: Direct UI Fix (Optional)
Append the docs link directly in `src/vs/workbench/contrib/chat/browser/widget/chatContentParts/toolInvocationParts/chatTerminalToolConfirmationSubPart.ts` alongside the unsandbox reason markdown.

**Trade-offs:**
- better control over exact placement next to the reason text
- worse ownership split, because terminal-specific content moves into the chat renderer
- harder to test with the existing tool-layer tests

## Confidence Level: High

## Reasoning
This proposal fits the issue comments, the current architecture, and the existing test surface.

- The maintainer feedback explicitly asks for a docs link and provides the final aka.ms URL.
- The current widget already supports markdown links; the problem is that the unsandbox flow does not send one to the visible disclaimer area.
- `confirmationMessages.message` is not the right place to solve this because, in `ChatTerminalToolConfirmationSubPart`, that field is only used for hover content on the editor, not as the primary visible explanation.
- Adding the learn-more link through `confirmationMessages.disclaimer` fixes the actual user-facing prompt with the smallest possible change.
- The narrow unit test in `runInTerminalTool.test.ts` can validate the new behavior without introducing broader UI test churn.