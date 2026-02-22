# Issue #204995: Unexpected call to getParent

**Repository:** microsoft/vscode
**Author:** @vscodenpa
**Created:** 2024-02-12T14:26:08Z
**Labels:** bug, error-telemetry, scm, insiders-released

## Description

```javascript
Error: Unexpected call to getParent
at Xe.getParent in src/vs/workbench/contrib/scm/browser/scmViewPane.ts:3571:10
at J.expandTo in src/vs/base/browser/ui/tree/asyncDataTree.ts:666:30
at <anonymous> in src/vs/workbench/contrib/scm/browser/scmViewPane.ts:2934:25
at promiseTask in src/vs/base/common/async.ts:239:49
```
[Go to Errors Site](https://errors.code.visualstudio.com/card?ch=31c37ee8f63491495ac49e43b8544550fbae4533&bH=f2f12e0c-70aa-d7b2-f9c5-1c64f5b6068f)

## Comments

