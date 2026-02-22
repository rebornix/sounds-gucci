# Issue #285923: Cannot read properties of undefined (reading 'querySelector')

**Repository:** microsoft/vscode
**Author:** @app/vs-code-engineering
**Created:** 2026-01-05T12:02:30Z
**Labels:** error-telemetry, insiders-released

## Description

```javascript
TypeError: Cannot read properties of undefined (reading 'querySelector')
at vb.y in vs/workbench/contrib/terminalContrib/suggest/browser/terminal.suggest.contribution.ts:169:34
at Sce.value in vs/workbench/contrib/terminalContrib/suggest/browser/terminal.suggest.contribution.ts:87:11
at E.C in ./file:/Users/cloudtest/vss/_work/1/s/src/vs/base/common/event.ts:1202:13
at E.D in ./file:/Users/cloudtest/vss/_work/1/s/src/vs/base/common/event.ts:1213:9
at E.fire in ./file:/Users/cloudtest/vss/_work/1/s/src/vs/base/common/event.ts:1237:9
at _Cn.Lb in vs/workbench/services/configuration/browser/configurationService.ts:1121:35
at _Cn.tb in vs/workbench/services/configuration/browser/configurationService.ts:768:9
at Sce.value in vs/workbench/services/configuration/browser/configurationService.ts:155:104
at E.C in ./file:/Users/cloudtest/vss/_work/1/s/src/vs/base/common/event.ts:1202:13
at E.D in ./file:/Users/cloudtest/vss/_work/1/s/src/vs/base/common/event.ts:1213:9
```
[Go to Errors Site](https://errors.code.visualstudio.com/card?ch=994fd12f8d3a5aa16f17d42c041e5809167e845a&bH=185f799e-a031-8036-240c-d20e1f6b4d9c)

## Comments

