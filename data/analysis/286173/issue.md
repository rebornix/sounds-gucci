# Issue #283291: Cannot read properties of undefined (reading 'appendChild')

**Repository:** microsoft/vscode
**Author:** @app/vs-code-engineering
**Created:** 2025-12-13T08:15:51Z
**Labels:** bug, error-telemetry, insiders-released

## Description

```javascript
TypeError: Cannot read properties of undefined (reading 'appendChild')
at new g1t in vs/workbench/services/suggest/browser/simpleSuggestWidget.ts:173:19
at GMt.o in ./file:/Users/cloudtest/vss/_work/1/s/src/vs/platform/instantiation/common/instantiationService.ts:162:18
at GMt.createInstance in ./file:/Users/cloudtest/vss/_work/1/s/src/vs/platform/instantiation/common/instantiationService.ts:128:18
at b1t.zb in vs/workbench/contrib/terminalContrib/suggest/browser/terminalSuggestAddon.ts:794:68
at b1t.yb in vs/workbench/contrib/terminalContrib/suggest/browser/terminalSuggestAddon.ts:763:30
at b1t.jb in vs/workbench/contrib/terminalContrib/suggest/browser/terminalSuggestAddon.ts:385:8
at async b1t.requestCompletions in vs/workbench/contrib/terminalContrib/suggest/browser/terminalSuggestAddon.ts:432:3
```
[Go to Errors Site](https://errors.code.visualstudio.com/card?ch=618725e67565b290ba4da6fe2d29f8fa1d4e3622&bH=7453c991-5d52-ec82-6a37-fed27efd9aa8)

## Comments


### @dmitrivMS (2026-01-06T06:00:31Z)

@meganrogge I linked the PR above by mistake, it would not address this issue.

---
