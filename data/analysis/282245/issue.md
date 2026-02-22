# Issue #282175: Review copilot PR feedback

**Repository:** microsoft/vscode
**Author:** @bpasero
**Created:** 2025-12-09T09:18:23Z
**Labels:** debt, insiders-released

## Description

The condition `if (inProgress.length)` checks if ANY session is in progress globally, not whether THIS specific session is in progress. When there are in-progress sessions, this will call `getInProgressSessionDescription(model)` for ALL sessions, including completed ones. Since `getInProgressSessionDescription` returns `undefined` for completed sessions, this will set `session.description = undefined` for completed sessions, losing their original description value from the provider.

Consider either:
1. Removing the `if (inProgress.length)` condition and unconditionally calling `getInProgressSessionDescription(model)`, then only assigning if the result is not undefined: `const desc = this._chatSessionsService.getInProgressSessionDescription(model); if (desc) { session.description = desc; }`
2. Or, keeping the condition but only assigning when the result is not undefined (same solution as above)
```suggestion
		// Override description only if there is an in-progress description for this session
		const desc = this._chatSessionsService.getInProgressSessionDescription(model);
		if (desc !== undefined) {
			session.description = desc;
```

_Originally posted by @Copilot in https://github.com/microsoft/vscode/pull/282172#discussion_r2601742212_
            

## Comments


### @osortega (2025-12-09T16:20:12Z)

The suggestion is not fully right, we need to override the description for all sessions that are in progress, even if the progress is undefined.
This is because when the chat is in progress we need to prioritize the description from the model.

Sent a PR to fix the issue

---
