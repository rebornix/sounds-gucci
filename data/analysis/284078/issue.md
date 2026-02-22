# Issue #283296: this.O is not a function

**Repository:** microsoft/vscode
**Author:** @app/vs-code-engineering
**Created:** 2025-12-13T08:17:56Z
**Labels:** error-telemetry, insiders-released

## Description

```javascript
TypeError: this.O is not a function
at Sce.M [as value] in vs/workbench/contrib/update/browser/releaseNotesEditor.ts:594:9
at E.C in ./file:/Users/cloudtest/vss/_work/1/s/src/vs/base/common/event.ts:1202:13
at E.D in ./file:/Users/cloudtest/vss/_work/1/s/src/vs/base/common/event.ts:1213:9
at E.fire in ./file:/Users/cloudtest/vss/_work/1/s/src/vs/base/common/event.ts:1237:9
at OCn.Lb in vs/workbench/services/configuration/browser/configurationService.ts:1121:35
at OCn.wb in vs/workbench/services/configuration/browser/configurationService.ts:817:8
at OCn.reloadLocalUserConfiguration in vs/workbench/services/configuration/browser/configurationService.ts:657:9
at async OCn.Hb in vs/workbench/services/configuration/browser/configurationService.ts:1044:6
at async Promise.all (index 0)
at async Object.e [as settled] in ./file:/Users/cloudtest/vss/_work/1/s/src/vs/base/common/async.ts:1820:18
```
[Go to Errors Site](https://errors.code.visualstudio.com/card?ch=618725e67565b290ba4da6fe2d29f8fa1d4e3622&bH=fe321c52-a018-ec6a-f885-21c235c428b4)

## Comments

