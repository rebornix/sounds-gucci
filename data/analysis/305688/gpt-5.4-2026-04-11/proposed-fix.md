# Bug Analysis: Issue #305688

## Understanding the Bug

The issue is a sessions list rendering bug affecting approvals or permissions shown for live chat sessions. The issue body only contains a screenshot, but the relevant pre-fix code makes the likely symptom clear: the sessions list renders approval previews in a code-block style even when the approval text is a normal permission message, which would make the row look visually wrong in the list.

The issue comments do not add implementation detail beyond noting that it was fixed later in PR #306008.

## Git History Analysis

I first checked the configured clone from `.config` (`/Users/penlv/Code/Work/vscode2`) at parent commit `c389bd92a06b63b41edc301b17529fe06b50fc2d`.

Recent history around the parent commit did not reveal an obvious regression in the last week:

- `c389bd92a06` `sessions - fix dangling separator in aux windows (#306018)`

That commit is unrelated to approval rendering. The more relevant history is file-local history for the agent sessions viewer:

- `7b9ab5ae65c` introduced the approval row in the sessions list.
- `0be0030e0ed` changed the approval row to support multiline terminal commands by rendering each visible line as a fenced code block.
- `e2c78d20cb8` and `1d8f0aa771f` only touched section styling and icon colors, not approval-row behavior.

The strongest signal is `0be0030e0ed`, because it explicitly optimized for terminal command approvals but the renderer still applies that code-block rendering path to every approval preview.

### Time Window Used

- Initial: 24 hours
- Final: 168 hours (expanded twice)

## Root Cause

`AgentSessionApprovalModel` produces two different kinds of approval labels:

- Terminal approvals: command lines with a `languageId`
- Generic approvals or permissions: plain text from `needsInput.detail` or `invocationMessage`, with `languageId === undefined`

The sessions list renderer in `src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsViewer.ts` does not preserve that distinction. In `renderApprovalRow`, it always renders the preview as one or more fenced code blocks and even falls back to `json` when no language is available.

That means plain-language permission prompts are displayed with code-block markup intended for terminal commands. The model tests already show that non-terminal approvals are ordinary text (`languageId: undefined`), and other chat confirmation surfaces render those messages as plain text, so the list renderer is the outlier.

## Proposed Fix

### Option A: Targeted Fix (Recommended)

**Affected Files:**

- `src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsViewer.ts`

**Changes Required:**

Keep the existing multiline code preview only for terminal approvals, and render generic permission prompts as plain text instead of as fenced code blocks.

Concretely:

1. In `renderApprovalRow`, branch on whether the approval is code-like.
2. If `info.languageId` is present, keep the current multiline code-block preview and code-block hover.
3. If `info.languageId` is absent, render the preview as plain text using `MarkdownString.appendText(...)` or `textContent`, and use plain-text hover content as well.
4. Do not fall back to `'json'` for non-terminal approvals.

This is the smallest change that directly addresses the incorrect rendering without changing the approval model or list layout.

**Code Sketch:**

```ts
private renderApprovalRow(session: ITreeNode<IAgentSession, FuzzyScore>, template: IAgentSessionItemTemplate): void {
	if (this._approvalModel === undefined) {
		throw new BugIndicatingError('Approval model is required to render approval row');
	}

	const approvalModel = this._approvalModel;
	const initialInfo = approvalModel.getApproval(session.element.resource).get();
	let wasVisible = !!initialInfo;
	template.approvalRow.classList.toggle('visible', wasVisible);

	const buttonStore = template.elementDisposable.add(new DisposableStore());

	template.elementDisposable.add(autorun(reader => {
		buttonStore.clear();

		const info = approvalModel.getApproval(session.element.resource).read(reader);
		const visible = !!info;
		template.approvalRow.classList.toggle('visible', visible);

		if (info) {
			if (info.languageId) {
				const lines = info.label.split(/\r?\n/);
				const visibleLines = lines.slice(0, AgentSessionRenderer.APPROVAL_ROW_MAX_LINES);
				if (lines.length > AgentSessionRenderer.APPROVAL_ROW_MAX_LINES) {
					visibleLines[AgentSessionRenderer.APPROVAL_ROW_MAX_LINES - 1] += ' …';
				}

				const preview = new MarkdownString();
				for (const line of visibleLines) {
					preview.appendCodeblock(info.languageId, line);
				}
				this.renderMarkdownOrText(preview, template.approvalLabel, buttonStore);

				buttonStore.add(this.hoverService.setupDelayedHover(template.approvalLabel, {
					content: new MarkdownString().appendCodeblock(info.languageId, info.label),
					style: HoverStyle.Pointer,
					position: { hoverPosition: HoverPosition.BELOW },
				}));
			} else {
				const preview = new MarkdownString().appendText(info.label);
				this.renderMarkdownOrText(preview, template.approvalLabel, buttonStore);

				buttonStore.add(this.hoverService.setupDelayedHover(template.approvalLabel, {
					content: new MarkdownString().appendText(info.label),
					style: HoverStyle.Pointer,
					position: { hoverPosition: HoverPosition.BELOW },
				}));
			}

			template.approvalButtonContainer.textContent = '';
			const isActive = this._activeSessionResource.read(reader)?.toString() === session.element.resource.toString();
			const button = buttonStore.add(new Button(template.approvalButtonContainer, {
				title: localize('allowActionOnce', 'Allow once'),
				secondary: isActive,
				...defaultButtonStyles
			}));
			button.label = localize('allowAction', 'Allow');
			buttonStore.add(button.onDidClick(() => info.confirm()));
		}

		if (wasVisible !== visible) {
			wasVisible = visible;
			this._onDidChangeItemHeight.fire(session.element);
		}
	}));
}
```

### Option B: Comprehensive Fix (Optional)

**Affected Files:**

- `src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionApprovalModel.ts`
- `src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsViewer.ts`

Add an explicit preview kind to `IAgentSessionApprovalInfo`, such as `kind: 'terminal' | 'generic'`, and make the renderer branch on that instead of inferring from `languageId`.

This is more explicit and avoids edge cases where a terminal approval may not resolve a language identifier, but it is broader than necessary for the symptom described in the issue.

## Confidence Level: Medium

## Reasoning

The evidence points consistently at the sessions list renderer rather than the approval model or a recent CSS-only change:

- The issue is specifically about rendering in the list.
- The only recent commit in the parent time window is unrelated.
- File-local history shows the approval row was built around code-block rendering for approvals.
- `agentSessionApprovalModel.test.ts` shows generic approvals carry plain text with no `languageId`.
- Other confirmation surfaces in chat render non-terminal approval text as plain text, not as code.

So the bug is most likely that the list preview uses terminal-command presentation rules for generic permission prompts. Rendering only terminal approvals as code and leaving generic approvals as plain text is the minimal fix that matches the data model and the rest of the UI.