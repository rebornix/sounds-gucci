# Issue #283295: Cannot read properties of undefined (reading 'match')

**Repository:** microsoft/vscode
**Author:** @app/vs-code-engineering
**Created:** 2025-12-13T08:16:47Z
**Labels:** error-telemetry, debt, insiders-released

## Description

```javascript
TypeError: Cannot read properties of undefined (reading 'match')
at b1t.sb in vs/workbench/contrib/terminalContrib/suggest/browser/terminalSuggestAddon.ts:574:45
at Sce.value in vs/workbench/contrib/terminalContrib/suggest/browser/terminalSuggestAddon.ts:218:57
at E.C in ./file:/Users/cloudtest/vss/_work/1/s/src/vs/base/common/event.ts:1202:13
at E.D in ./file:/Users/cloudtest/vss/_work/1/s/src/vs/base/common/event.ts:1213:9
at E.fire in ./file:/Users/cloudtest/vss/_work/1/s/src/vs/base/common/event.ts:1237:9
at zTe.M in ./file:/Users/cloudtest/vss/_work/1/s/src/vs/platform/terminal/common/capabilities/commandDetection/promptInputModel.ts:447:27
at zTe.L in ./file:/Users/cloudtest/vss/_work/1/s/src/vs/platform/terminal/common/capabilities/commandDetection/promptInputModel.ts:267:9
at zTe.<anonymous> in ./file:/Users/cloudtest/vss/_work/1/s/src/vs/base/common/decorators.ts:117:8
at <anonymous> in ./file:/Users/cloudtest/vss/_work/1/s/src/vs/platform/terminal/common/capabilities/commandDetection/promptInputModel.ts:124:16
at g.value in ./file:/Users/cloudtest/vss/_work/1/s/src/vs/base/common/event.ts:182:85
```
[Go to Errors Site](https://errors.code.visualstudio.com/card?ch=618725e67565b290ba4da6fe2d29f8fa1d4e3622&bH=c26ad9f0-b654-a71d-f9e6-ee71fa153e54)

## Comments

