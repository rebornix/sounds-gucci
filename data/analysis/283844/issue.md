# Issue #283302: Cannot read properties of undefined (reading 'setAttribute')

**Repository:** microsoft/vscode
**Author:** @app/vs-code-engineering
**Created:** 2025-12-13T08:19:34Z
**Labels:** bug, error-telemetry, insiders-released

## Description

```javascript
TypeError: Cannot read properties of undefined (reading 'setAttribute')
at xlt.s in ./file:/Users/cloudtest/vss/_work/1/s/src/vs/platform/actions/browser/actionWidgetDropdownActionViewItem.ts:70:11
at xlt.q in vs/workbench/contrib/chat/browser/modelPicker/modePickerActionItem.ts:153:8
at Object.run in vs/workbench/contrib/chat/browser/modelPicker/modePickerActionItem.ts:84:11
```
[Go to Errors Site](https://errors.code.visualstudio.com/card?ch=618725e67565b290ba4da6fe2d29f8fa1d4e3622&bH=61db2c29-296a-df51-1a51-1c735faf62f3)

## Comments

