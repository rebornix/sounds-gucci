# Issue #283287: Cannot read properties of undefined (reading 'querySelector')

**Repository:** microsoft/vscode
**Author:** @app/vs-code-engineering
**Created:** 2025-12-13T08:14:50Z
**Labels:** error-telemetry, debt, insiders-released

## Description

```javascript
TypeError: Cannot read properties of undefined (reading 'querySelector')
at vb.y in vs/workbench/contrib/terminalContrib/suggest/browser/terminal.suggest.contribution.ts:169:34
at Sce.value in vs/workbench/contrib/terminalContrib/suggest/browser/terminal.suggest.contribution.ts:87:11
at E.C in ./file:/Users/cloudtest/vss/_work/1/s/src/vs/base/common/event.ts:1202:13
at E.D in ./file:/Users/cloudtest/vss/_work/1/s/src/vs/base/common/event.ts:1213:9
at E.fire in ./file:/Users/cloudtest/vss/_work/1/s/src/vs/base/common/event.ts:1237:9
at OCn.Lb in vs/workbench/services/configuration/browser/configurationService.ts:1121:35
at OCn.tb in vs/workbench/services/configuration/browser/configurationService.ts:768:9
at Sce.value in vs/workbench/services/configuration/browser/configurationService.ts:155:104
at E.C in ./file:/Users/cloudtest/vss/_work/1/s/src/vs/base/common/event.ts:1202:13
at E.D in ./file:/Users/cloudtest/vss/_work/1/s/src/vs/base/common/event.ts:1213:9
```
[Go to Errors Site](https://errors.code.visualstudio.com/card?ch=618725e67565b290ba4da6fe2d29f8fa1d4e3622&bH=a4a23f66-fd58-e8c3-b902-da9f8f215bba)

## Comments

