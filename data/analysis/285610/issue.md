# Issue #145504: Cannot read property 'end' of undefined

**Repository:** microsoft/vscode
**Author:** @vscode-triage-bot
**Created:** 2022-03-20T13:59:38Z
**Labels:** bug, error-telemetry, debt, git, insiders-released

## Description

```javascript
TypeError: Cannot read property 'end' of undefined
at <anonymous> in extensions/git/src/repository.ts:1707:18
at new Promise (<anonymous>)
at <anonymous> in extensions/git/src/repository.ts:1695:11
at O.retryRun in extensions/git/src/repository.ts:1822:18
at O.run in extensions/git/src/repository.ts:1795:30
at O.checkIgnore in extensions/git/src/repository.ts:1694:15
at checkIgnore in extensions/git/src/decorationProvider.ts:65:20
at apply in extensions/git/src/decorators.ts:98:41
at listOnTimeout in internal/timers.js:554:17
at processTimers in internal/timers.js:497:7
```
[Go to Errors Site](https://vscode-errors.azurewebsites.net/card?ch=c722ca6c7eed3d7987c0d5c3df5c45f6b15e77d1&bH=18cf951c-449a-a488-3f7c-697c5ab41863)

## Comments

