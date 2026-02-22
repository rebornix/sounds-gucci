# PR #283958: Fix TypeError when accessing undefined character in terminal suggest trigger detection

**Repository:** microsoft/vscode
**Labels:** 
**Merge Commit:** `88b7540ba1c539ea006bcc283a65655d39b19226`
**Parent Commit:** `8202cbb14c1dc04421e66d188be43025f1dd91f5`

## Description

`char.match()` throws TypeError when `this._mostRecentPromptInputState.value[cursorIndex - 1]` returns `undefined` due to out-of-bounds array access.

Added null guard before calling `.match()`, consistent with existing patterns in the file (lines 540, 543, 553, 616):

```typescript
// Before
if (
    this._isFilteringDirectories && char.match(/[\\\/]$/) ||
    this._checkProviderTriggerCharacters(char)
)

// After  
if (
    char && (
        this._isFilteringDirectories && char.match(/[\\\/]$/) ||
        this._checkProviderTriggerCharacters(char)
    )
)
```

<!-- START COPILOT ORIGINAL PROMPT -->



<details>

<summary>Original prompt</summary>

> 
> ----
> 
> *This section details on the original issue you should resolve*
> 
> <issue_title>Cannot read properties of undefined (reading 'match')</issue_title>
> <issue_description>```javascript
> TypeError: Cannot read properties of undefined (reading 'match')
> at b1t.sb in vs/workbench/contrib/terminalContrib/suggest/browser/terminalSuggestAddon.ts:574:45
> at Sce.value in vs/workbench/contrib/terminalContrib/suggest/browser/terminalSuggestAddon.ts:218:57
> at E.C in ./file:/Users/cloudtest/vss/_work/1/s/src/vs/base/common/event.ts:1202:13
> at E.D in ./file:/Users/cloudtest/vss/_work/1/s/src/vs/base/common/event.ts:1213:9
> at E.fire in ./file:/Users/cloudtest/vss/_work/1/s/src/vs/base/common/event.ts:1237:9
> at zTe.M in ./file:/Users/cloudtest/vss/_work/1/s/src/vs/platform/terminal/common/capabilities/commandDetection/promptInputModel.ts:447:27
> at zTe.L in ./file:/Users/cloudtest/vss/_work/1/s/src/vs/platform/terminal/common/capabilities/commandDetection/promptInputModel.ts:267:9
> at zTe.<anonymous> in ./file:/Users/cloudtest/vss/_work/1/s/src/vs/base/common/decorators.ts:117:8
> at <anonymous> in ./file:/Users/cloudtest/vss/_work/1/s/src/vs/platform/terminal/common/capabilities/commandDetection/promptInputModel.ts:124:16
> at g.value in ./file:/Users/cloudtest/vss/_work/1/s/src/vs/base/common/event.ts:182:85
> ```
> [Go to Errors Site](https://errors.code.visualstudio.com/card?ch=618725e67565b290ba4da6fe2d29f8fa1d4e3622&bH=c26ad9f0-b654-a71d-f9e6-ee71fa153e54)</issue_description>
> 
> ## Comments on the Issue (you are @copilot in this section)
> 
> <comments>
> </comments>
> 


</details>



<!-- START COPILOT CODING AGENT SUFFIX -->

- Fixes microsoft/vscode#283295

<!-- START COPILOT CODING AGENT TIPS -->
---

💡 You can make Copilot smarter by setting up custom instructions, customizing its development environment and configuring Model Context Protocol (MCP) servers. Learn more [Copilot coding agent tips](https://gh.io/copilot-coding-agent-tips) in the docs.

## Commits

- Initial plan
- Fix undefined char.match() error in terminalSuggestAddon

## Changed Files

- src/vs/workbench/contrib/terminalContrib/suggest/browser/terminalSuggestAddon.ts
