# PR #282221: Fix race condition causing "Model is disposed!" error in virtual document updates

**Repository:** microsoft/vscode
**Labels:** 
**Merge Commit:** `5639dca9912d7ab8896929b1a09f30f883ead43f`
**Parent Commit:** `5a6cdd0697cbeaadf0fff04abe4855e00b813e75`

## Description

## Plan to Fix "Model is disposed!" Error

- [x] Understand the issue: The model can be disposed between the initial check and applyEdits call in $onVirtualDocumentChange
- [x] Add isDisposed() check before applyEdits in mainThreadDocumentContentProviders.ts
- [x] Add test case to verify the fix handles disposed models correctly
- [x] Verify compilation succeeds (0 errors)
- [x] Request code review (passed with no issues)
- [x] Fix formatting with blank line between if blocks

<!-- START COPILOT ORIGINAL PROMPT -->



<details>

<summary>Original prompt</summary>

> 
> ----
> 
> *This section details on the original issue you should resolve*
> 
> <issue_title>Model is disposed!</issue_title>
> <issue_description>```javascript
> Error: Model is disposed!
> at V.ib in src/vs/editor/common/model/textModel.ts:416:10
> at V.validateRange in src/vs/editor/common/model/textModel.ts:1062:8
> at V.tb in src/vs/editor/common/model/textModel.ts:1251:9
> at V.ub in src/vs/editor/common/model/textModel.ts:1262:21
> at V.applyEdits in src/vs/editor/common/model/textModel.ts:1416:28
> at i.$onVirtualDocumentChange in src/vs/workbench/api/browser/mainThreadDocumentContentProviders.ts:88:11
> ```
> [Go to Errors Site](https://errors.code.visualstudio.com/card?ch=dc96b837cf6bb4af9cd736aa3af08cf8279f7685&bH=4eff9e3b-4271-0907-32e2-4afa346d5cef)</issue_description>
> 
> <agent_instructions>check here also that the model isn't disposed
> ```
> async $onVirtualDocumentChange(uri: UriComponents, value: string): Promise<void> {
> 		const model = this._modelService.getModel(URI.revive(uri));
> 		if (!model) {
> 			return;
> 		}
> ```</agent_instructions>
> 
> ## Comments on the Issue (you are @copilot in this section)
> 
> <comments>
> </comments>
> 


</details>



<!-- START COPILOT CODING AGENT SUFFIX -->

- Fixes microsoft/vscode#212713

<!-- START COPILOT CODING AGENT TIPS -->
---

💬 We'd love your input! Share your thoughts on Copilot coding agent in our [2 minute survey](https://gh.io/copilot-coding-agent-survey).

## Commits

- Initial plan
- Add isDisposed check before applyEdits to prevent "Model is disposed!…
- Fix formatting: add blank line between if blocks for better readability
- format documents

## Changed Files

- src/vs/workbench/api/browser/mainThreadDocumentContentProviders.ts
- src/vs/workbench/api/test/browser/mainThreadDocumentContentProviders.test.ts
