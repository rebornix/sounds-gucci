# PR #286173: Fix race condition in terminal suggest widget initialization causing appendChild crash

**Repository:** microsoft/vscode
**Labels:** 
**Merge Commit:** `a9676225eb6c43be43f8debcac2826ee989cc145`
**Parent Commit:** `08070ad04628042936cce80229c1e21698d06480`

## Description

The terminal suggest widget crashes with `TypeError: Cannot read properties of undefined (reading 'appendChild')` when completions are requested before the DOM container is initialized. This occurs because `_prepareAddonLayout()` runs asynchronously while the addon can immediately receive completion requests.

## Changes

Added container guards at both widget creation call sites:

**`_showCompletions()`**
```typescript
// Before
if (!this._terminal?.element) {
    return;
}

// After
if (!this._terminal?.element || !this._container) {
    return;
}
```

**`_handleCompletionProviders()`**
```typescript
// Before
if (explicitlyInvoked) {
    const suggestWidget = this._ensureSuggestWidget(terminal);
    // ...
}

// After
if (explicitlyInvoked && this._container) {
    const suggestWidget = this._ensureSuggestWidget(terminal);
    // ...
}
```

This prevents `_ensureSuggestWidget()` from attempting to create the widget with an undefined container. Widget operations are skipped until initialization completes.

<!-- START COPILOT ORIGINAL PROMPT -->



<details>

<summary>Original prompt</summary>

> 
> ----
> 
> *This section details on the original issue you should resolve*
> 
> <issue_title>Cannot read properties of undefined (reading 'appendChild')</issue_title>
> <issue_description>```javascript
> TypeError: Cannot read properties of undefined (reading 'appendChild')
> at new g1t in vs/workbench/services/suggest/browser/simpleSuggestWidget.ts:173:19
> at GMt.o in ./file:/Users/cloudtest/vss/_work/1/s/src/vs/platform/instantiation/common/instantiationService.ts:162:18
> at GMt.createInstance in ./file:/Users/cloudtest/vss/_work/1/s/src/vs/platform/instantiation/common/instantiationService.ts:128:18
> at b1t.zb in vs/workbench/contrib/terminalContrib/suggest/browser/terminalSuggestAddon.ts:794:68
> at b1t.yb in vs/workbench/contrib/terminalContrib/suggest/browser/terminalSuggestAddon.ts:763:30
> at b1t.jb in vs/workbench/contrib/terminalContrib/suggest/browser/terminalSuggestAddon.ts:385:8
> at async b1t.requestCompletions in vs/workbench/contrib/terminalContrib/suggest/browser/terminalSuggestAddon.ts:432:3
> ```
> [Go to Errors Site](https://errors.code.visualstudio.com/card?ch=618725e67565b290ba4da6fe2d29f8fa1d4e3622&bH=7453c991-5d52-ec82-6a37-fed27efd9aa8)</issue_description>
> 
> ## Comments on the Issue (you are @copilot in this section)
> 
> <comments>
> <comment_new><author>@dmitrivMS</author><body>
> @meganrogge I linked the PR above by mistake, it would not address this issue.</body></comment_new>
> </comments>
> 


</details>



<!-- START COPILOT CODING AGENT SUFFIX -->

- Fixes microsoft/vscode#283291

<!-- START COPILOT CODING AGENT TIPS -->
---

✨ Let Copilot coding agent [set things up for you](https://github.com/microsoft/vscode/issues/new?title=✨+Set+up+Copilot+instructions&body=Configure%20instructions%20for%20this%20repository%20as%20documented%20in%20%5BBest%20practices%20for%20Copilot%20coding%20agent%20in%20your%20repository%5D%28https://gh.io/copilot-coding-agent-tips%29%2E%0A%0A%3COnboard%20this%20repo%3E&assignees=copilot) — coding agent works faster and does higher quality work when set up for your repo.

## Commits

- Initial plan
- Fix race condition causing undefined container in SimpleSuggestWidget

## Changed Files

- src/vs/workbench/contrib/terminalContrib/suggest/browser/terminalSuggestAddon.ts
